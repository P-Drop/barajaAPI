# syntax=docker/dockerfile:1

# -------- Stage 1: build --------
FROM node:24-slim AS build
WORKDIR /app

# TLS Prisma-Supabase: openssl y ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Solo manifiestos -> cachea capa de npm ci si no cambian deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Deshabilitar Husky (hooks solo local)
ENV HUSKY=0

# Instalar TODAS las deps (dev: tsc, prisma) para compilar
RUN npm ci

# Código
COPY . .

# Placeholder SOLO para que `prisma generate` resuelva el datasource en build
# No conecta a ninguna BD; la DATABASE_URL real se inyecta en runtime.
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Script de build
RUN npm run build -w api

# -------- Stage 2: runtime --------
FROM node:24-slim AS runtime
WORKDIR /app/apps/api
ARG GIT_SHA=dev
ENV NODE_ENV=production
ENV SENTRY_RELEASE=$GIT_SHA

# TLS engine-Supabase: openssl y ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# node_modules de los dos workspaces + el compilado (.so.node)
COPY --from=build --chown=node:node /app/node_modules /app/node_modules
COPY --from=build --chown=node:node /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./package.json
COPY --from=build --chown=node:node /app/package.json /app/package.json

# Ejecutar sin privilegios (usuario "node")
USER node
EXPOSE 3000

CMD ["node", "dist/server.js"]