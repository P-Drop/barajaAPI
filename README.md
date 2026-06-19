# barajaAPI

API REST de la baraja española. 🚧 Proyecto en desarrollo.

## Tecnologías

- Node.js 24 + TypeScript (ESM)
- Express 5
- Vitest + Supertest (testing)
- Helmet y CORS (seguridad)
- dotenv (variables de entorno)
- PostgreSQL (`pg`) y Zod — previstos para próximas fases

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

| **Variable**  | **Descripción**            | **Por defecto** |
| ------------- | -------------------------- | --------------- |
| `PORT`        | Puerto del servidor        | `3000`          |
| `CORS_ORIGIN` | Origen permitido para CORS | `*`             |

## Scripts

Se ejecutan dentro de `apps/api` (o desde la raíz con -w api):

| **Script**           | **Qué hace**                                    |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | Levanta el servidor en desarrollo (con recarga) |
| `npm run build`      | Compila TypeScript a `dist/`                    |
| `npm start`          | Arranca el servidor ya compilado                |
| `npm test`           | Ejecuta los tests una vez                       |
| `npm run test:watch` | Ejecuta los tests en modo watch                 |

Ejemplo:

```bash
cd apps/api
npm run dev
```

## Endpoints

**`GET /api/health`**

Comprueba que la API está funcionando.
Respuesta:

```bash
{
    "status": "OK",
    "message": "Hello World! API funcionando correctamente.",
    "timestamp": "2026-06-19T09:35:55.575Z"
}
```

## Estructura del proyecto

```bash
apps/api/src/
├─ config/        # configuración (variables de entorno)
├─ controllers/   # lógica de cada endpoint
├─ routes/        # definición de rutas
├─ middlewares/   # manejo de errores y 404
├─ services/      # lógica de negocio (en construcción)
├─ repositories/  # acceso a datos (en construcción)
├─ app.ts         # configuración de Express
└─ server.ts      # arranque del servidor
```

## Tests

```bash
cd apps/api
npm test
```
