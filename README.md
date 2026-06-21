# barajaAPI

![CI](https://github.com/P-Drop/barajaAPI/actions/workflows/ci.yml/badge.svg)

API REST de la baraja española.

🚧 Proyecto en desarrollo [ROADMAP](./ROADMAP.md).

## Tecnologías

- Node.js 24 + TypeScript (ESM)
- Express 5
- Vitest + Supertest (testing)
- Helmet y CORS (seguridad)
- dotenv (variables de entorno)
- Zod (validación de variables de entorno)
- ESLint + Prettier (calidad de código)
- GitHub Actions (CI)
- PostgreSQL
- Prisma (ORM)
- pino (logging)
- OpenAPI / Swagger (docs)

## Requisitos

- Node.js >= 24
- npm >= 11

## Instalación

```bash
git clone https://github.com/P-Drop/barajaAPI.git
cd barajaAPI
npm install
```

## Variables de entorno

`cp apps/api/.env.example apps/api/.env`

| Variable     | Descripción                        |
| ------------ | ---------------------------------- |
| DATABASE_URL | Cadena de conexión a PostgreSQL    |
| PORT         | Puerto del servidor (3000)         |
| CORS_ORIGIN  | Origen permitido (\* en dev)       |
| NODE_ENV     | development / production / test    |
| LOG_LEVEL    | Nivel de pino (info por defecto)   |
| POSTGRES\_\* | (raíz) credenciales del contenedor |

## Scripts

Se ejecutan dentro de `apps/api` (o desde la raíz con -w api):

| **Script**                 | **Qué hace**                                    |
| -------------------------- | ----------------------------------------------- |
| `npm run dev`              | Levanta el servidor en desarrollo (con recarga) |
| `npm run build`            | Compila TypeScript a `dist/`                    |
| `npm start`                | Arranca el servidor ya compilado                |
| `npm test`                 | Ejecuta los tests una vez                       |
| `npm run test:watch`       | Ejecuta los tests en modo watch                 |
| `npm run lint`             | Analiza el código con ESLint                    |
| `npm run format`           | Formatea el código con Prettier                 |
| `npm run format:check`     | Verifica el formato (utilizado en CI)           |
| `npm run test:integration` | Tests contra la BD real (requiere Docker)       |

Ejemplo:

```bash
cd apps/api
npm run dev
```

## Desarrollo (con Docker):

```bash
# 1. Levantar PostgreSQL
docker compose up -d

# 2. Migrar y sembrar
cd apps/api
npx prisma migrate deploy && npx prisma db seed

# 3. Arrancar en modo desarrollo (logs legibles)
npm run dev
```

## Endpoints

Comprueba que la API está funcionando:

- `GET /api/health` — liveness
- `GET /api/health/ready` — readiness

Operaciones:

- `GET /api/v1/deck` — baraja (`?short=true` para la de 40)
- `GET /api/v1/deck/shuffle` — baraja barajada
- `GET /api/v1/deck/draw?count=N` — robar N cartas

📖 Documentación interactiva (Swagger): http://localhost:3000/api/docs

## Estructura del proyecto

```bash
apps/api/
├─ prisma/
│  ├─ migrations/        # migraciones (forward-only)
│  ├─ schema.prisma      # modelo de datos (enum Suit, Card)
│  └─ seed.ts            # siembra las 50 cartas
├─ src/
│  ├─ config/            # env (Zod) y logger (pino)
│  ├─ controllers/       # handlers HTTP (card, health)
│  ├─ db/                # cliente Prisma
│  ├─ docs/              # OpenAPI (registry + generación)
│  ├─ errors/            # DomainError
│  ├─ middlewares/       # errorHandler, notFound
│  ├─ repositories/      # acceso a datos (Prisma)
│  ├─ routes/            # agregador + card + health
│  ├─ schemas/           # schemas Zod (validan y documentan)
│  ├─ services/          # lógica (barajar, robar)
│  ├─ validators/        # validación de query
│  ├─ app.ts             # configuración de Express
│  └─ server.ts          # arranque
└─ tests/
   ├─ e2e/               # tests mockeados (rápidos, sin BD)
   └─ integration/       # tests contra BD real

```

## Tests

```bash
# Tests mockeados (rápidos, sin BD)
npm test

# Tests de integración (requieren Postgres)
docker compose up -d
npm run test:integration
```
