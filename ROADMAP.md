# Roadmap — barajaAPI

> Estados: ✅ Completado · ▶️ En progreso · ⏳ Planificado

## Fase 0: Cimientos y Configuración Inicial ▶️

- **Objetivo**: Establecer un entorno de trabajo profesional y predecible.
- **Hito**: Monorepo con Clean Architecture, calidad de código y CI básico.

#### Entregables:

- [x] Estructura base (Clean Architecture) y testing e2e (Health Check / liveness).
- [x] Stack moderno: ESM + TypeScript, Vitest + Supertest.
- [x] Seguridad base (helmet, CORS) y variables de entorno (dotenv).
- [x] Documentación inicial (README) y plantillas de PR/Issue.
- [ ] Validación de variables de entorno con Zod.
- [ ] Linter y formateador (ESLint + Prettier).
- [ ] CI básico en GitHub Actions (lint + test + build en cada PR).
- [ ] Tablero de proyecto y protección de la rama `main` (merge solo con CI en verde).

## Fase 1: Core API & MVP de la Baraja ⏳

- **Objetivo**: Construir la lógica de negocio central. La API debe ser capaz de servir, barajar y entregar cartas sin lógica de juegos específicos todavía.
- **Hito**: API funcional que devuelve representaciones estandarizadas de la baraja española de 48 cartas + 2 comodines (50), con opción de servir la baraja corta de 40 (sin ochos, nueves ni comodines) para los juegos que la requieran.

#### Entregables:

- [ ] **Diseño de datos**: esquema de base de datos para los palos (Oros, Copas, Espadas, Bastos) y sus valores.
- [ ] **Endpoints core** (versionados bajo `/api/v1`):
  - [ ] Obtener la baraja completa (40 ó 48+2 según parámetro).
  - [ ] Barajar y obtener un mazo aleatorio.
  - [ ] Robar N cartas de un mazo.
- [ ] **Health check de readiness**: endpoint que verifica la conexión a PostgreSQL (`SELECT 1`), separado del liveness de la Fase 0.
- [ ] **Logger estructurado básico**: reemplazar los `console.*` por un logger (p. ej. pino). La analítica avanzada queda para la Fase 4.
- [ ] **Documentación**: especificación de la API (Swagger/OpenAPI) para los consumidores.

## Fase 2: Despliegue Profesional (Go-to-Market de la API) ⏳

- **Objetivo**: Sacar el producto del entorno local y hacerlo accesible y seguro en la nube.
- **Hito**: API pública, segura y consumible a través de internet.

#### Entregables:

- [ ] Pipeline de **despliegue continuo (CD)** en GitHub Actions, sobre el CI ya establecido en la Fase 0.
- [ ] Base de datos de producción aprovisionada.
- [ ] Servidor desplegado con dominio y certificado de seguridad (SSL/HTTPS).
- [ ] Limitación de peticiones (Rate Limiting) para evitar abusos en producción.

## Fase 3: Interfaz Visual (Frontend MVP) ⏳

- **Objetivo**: Consumir nuestra propia API para validar su usabilidad y ofrecer una capa visual interactiva al usuario final.
- **Hito**: Aplicación web desplegada donde un usuario pueda ver y manipular la baraja.

#### Entregables:

- [ ] Configuración de la app de React/Vue dentro del monorepo.
- [ ] Catálogo visual de cartas (assets gráficos de la baraja).
- [ ] Interfaz para visualizar la baraja, "Barajar" con un clic y ver el resultado consumiendo los endpoints de la Fase 1.

## Fase 4: Observabilidad, Analítica y Control ⏳

- **Objetivo**: Soportar tráfico real y lógicas complejas entendiendo qué pasa dentro del producto.
- **Hito**: Panel de control del estado del sistema.

#### Entregables:

- [ ] Trazabilidad de peticiones (saber qué endpoint se usa más), ampliando el logger de la Fase 1.
- [ ] Registro de errores centralizado para detectar fallos en vivo.
- [ ] Métricas de uso (¿cuántas barajas se generan al día?).

## Fase 5: Motores de Juego (Expansión del Ecosistema) ⏳

- **Objetivo**: Evolucionar de un "repartidor de cartas" a una plataforma de juegos clásicos.
- **Hito**: Primer juego clásico completamente jugable a través de la API y el frontend.

#### Entregables:

- [ ] Gestor de sesiones/partidas (crear sala, unir jugadores).
- [ ] Máquina de estados para reglas de juego (turnos, puntuación).
- [ ] Comunicación en tiempo real (WebSockets) para multijugador.
- [ ] Lanzamiento del "Juego 1" (Brisca, Tute, Continental... por definir).
