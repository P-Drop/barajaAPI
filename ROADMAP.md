# Roadmap — barajaAPI

> Estados: ✅ Completado · ▶️ En progreso · ⏳ Planificado

## Fase 0: Cimientos y Configuración Inicial ✅

- **Objetivo**: Establecer un entorno de trabajo profesional y predecible.
- **Hito**: Monorepo con Clean Architecture, calidad de código y CI básico.

#### Entregables:

- [x] Estructura base (Clean Architecture) y testing e2e (Health Check / liveness).
- [x] Stack moderno: ESM + TypeScript, Vitest + Supertest.
- [x] Seguridad base (helmet, CORS) y variables de entorno (dotenv).
- [x] Documentación inicial (README) y plantillas de PR/Issue.
- [x] Validación de variables de entorno con Zod.
- [x] Linter y formateador (ESLint + Prettier).
- [x] CI básico en GitHub Actions (lint + test + build en cada PR).
- [x] Tablero de proyecto
- [x] Protección de la rama `main` (repo público requerido).

## Fase 1: Core API & MVP de la Baraja ✅

- **Objetivo**: Construir la lógica de negocio central. La API debe ser capaz de servir, barajar y entregar cartas sin lógica de juegos específicos todavía.
- **Hito**: API funcional que devuelve representaciones estandarizadas de la baraja española de 48 cartas + 2 comodines (50), con opción de servir la baraja corta de 40 (sin ochos, nueves ni comodines) para los juegos que la requieran.

#### Entregables:

- [x] **Diseño de datos**: esquema de base de datos para los palos (Oros, Copas, Espadas, Bastos) y sus valores.
- [x] **Endpoints core** (versionados bajo `/api/v1`):
  - [x] Obtener la baraja completa (40 ó 48+2 según parámetro).
  - [x] Barajar y obtener un mazo aleatorio.
  - [x] Robar N cartas de un mazo.
- [x] **Health check de readiness**: endpoint que verifica la conexión a PostgreSQL (`SELECT 1`), separado del liveness de la Fase 0.
- [x] **Logger estructurado básico**: reemplazar los `console.*` por un logger (p. ej. pino). La analítica avanzada queda para la Fase 4.
- [x] **Documentación**: especificación de la API (Swagger/OpenAPI) para los consumidores.
- [x] **Test & debug**: test de integración con BD real y edge cases.

## Fase 2: Despliegue Profesional (Go-to-Market de la API) ✅

- **Objetivo**: Sacar el producto del entorno local y hacerlo accesible y seguro en la nube.
- **Hito**: API pública, segura y consumible a través de internet.

#### Entregables:

- [x] Pipeline de **despliegue continuo (CD)** en GitHub Actions.
- [x] Base de datos de producción aprovisionada.
- [x] Servidor desplegado con dominio y certificado de seguridad (SSL/HTTPS).
- [x] Limitación de peticiones (Rate Limiting) para evitar abusos en producción.
- [x] PRs automáticos de dependencias (Dependabot o Renovate)
- [x] CHANGELOG y versionado semántico (releases)

## Fase 3: Interfaz Visual (Frontend MVP) ✅

- **Objetivo**: Consumir nuestra propia API para validar su usabilidad y ofrecer una capa visual interactiva al usuario final.
- **Hito**: Aplicación web desplegada donde un usuario pueda ver y manipular la baraja.

#### Entregables:

- [x] Configuración de la app de React/Vue dentro del monorepo.
- [x] Catálogo visual de cartas (assets gráficos de la baraja).
- [x] Interfaz para visualizar la baraja, "Barajar" con un clic y ver el resultado consumiendo los endpoints de la Fase 1.

## Fase 4: Observabilidad, Analítica y Control ✅

- **Objetivo**: Soportar tráfico real y lógicas complejas entendiendo qué pasa dentro del producto.
- **Hito**: Panel de control del estado del sistema.

#### Entregables:

- [x] Trazabilidad de peticiones (saber qué endpoint se usa más), ampliando el logger de la Fase 1.
- [x] Registro de errores centralizado para detectar fallos en vivo.
- [x] Métricas de uso (¿cuántas barajas se generan al día?).

## Fase 5: Motor de Juego - Solitario Orda ✅

- **Objetivo**: Evolucionar de un "repartidor de cartas" a una plataforma de juegos con identidad de jugador.
- **Hito**: [Solitario Orda](docs/ReglasSolitarioOrda.md) (juego original) completamente jugable a través de la API y el frontend.

#### Entregables:

- [x] Diseño y ADRs del motor: estado de partida, autenticación y política de abandono.
- [x] Identidad de jugador sin datos personales: registro y login (nickname anónimo, contraseña, avatar).
- [x] Motor de reglas server-authoritative del Solitario Orda (dominio puro, testeado contra el 100 % de las reglas).
- [x] Gestor de partidas persistente (crear, mover, abandonar) con bloqueo optimista y TTL de inactividad.
- [x] Perfil de jugador y ranking: estrellas con desempate por tiempo; logro _Escalera mecánica_.
- [x] Frontend: tablero completamente jugable, comodines y movimiento en bloque incluidos.
- [x] Observabilidad del juego: métricas de partidas y jugadores en el panel de Grafana.

## Fase 6: Producto - Frontend Profesional ⏳

- **Objetivo**: convertir un tablero funcional en un producto presentable: identidad visual propia, uso cómodo desde el móvil y accesible para cualquiera.
- **Hito**: Solitario Orda jugable y accesible (WCAG 2.2 AA) desde el móvil, con una portada que explica el juego a quien llega por primera vez.

#### Entregables:

- [ ] ADR del sistema de diseño: dirección de arte, estrategia de tema y compromiso de accesibilidad.
- [ ] Sistema de diseño: tokens de color, tipografía y espaciado; tema claro/oscuro y layout global (cabecera, navegación, pie).
- [ ] Portada del juego y arquitectura de navegación; el catálogo de la baraja queda como demo de la API.
- [ ] Registro, login y perfil rediseñados y operables sólo con teclado.
- [ ] Tablero responsive (móvil primero) con objetivos táctiles adecuados.
- [ ] Interacción de juego: arrastrar y soltar con alternativa accesible, animaciones que respetan `prefers-reduced-motion` y ayuda dentro del juego.
- [ ] Perfil y ranking con la identidad del jugador (avatar, estrellas, logros) y su posición.
- [ ] Accesibilidad WCAG 2.2 AA verificada en CI.

## Fase 7: Seguridad Ofensiva (Pentest de la Plataforma) ⏳

- **Objetivo**: Auditar la plataforma propia con mentalidad de atacante, ahora que existe superficie real (autenticación, estado de partidas, ranking), y remediar lo encontrado.
- **Hito**: Informe de pentest con hallazgos priorizados y remediaciones desplegadas en producción.

#### Entregables:

- [ ] Modelo de amenazas: activos, actores y superficies de ataque (API, auth, partidas, ranking, VPS).
- [ ] Auditoría de autenticación y autorización: fuerza bruta, JWT (manipulación, expiración, fortaleza del secret), acceso a partidas ajenas (IDOR).
- [ ] Revisión contra el OWASP API Security Top 10 (inyección, mass assignment, exposición de datos, rate limiting...).
- [ ] Anti-cheat: intento de trampas de juego - movimientos ilegales fabricados, carreras contra el bloqueo optimista, manipulación de tiempos y puntuación.
- [ ] Auditoría de dependencias y de la imagen Docker (npm audit, escáner de imagen).
- [ ] Informe final con severidades, issues de remediación y verificación del checklist de hardening de los runbooks.

## Fase 8: Plataforma Multijugador ⏳

- **Objetivo**: Extender el motor a partidas de N jugadores en tiempo real.
- **Hito**: Primer juego multijugador clásico (Brisca, Tute, Continental... por definir) jugable en salas.

#### Entregables:

- [ ] Gestor de salas: crear sala, unir jugadores, presencia.
- [ ] Comunicación en tiempo real (WebSockets): upgrade en Nginx, autenticación del handshake, rate limiting y trazabilidad de conexiones.
- [ ] Motor de turnos multijugador (extensión del motor de la Fase 5) con vistas por jugador (información oculta).
- [ ] Reconexión y abandono en tiempo real (presencia por WebSocket en lugar de TTL - requerirá su ADR).
- [ ] Lanzamiento del primer juego multijugador con su frontend.
- [ ] Observabilidad del tiempo real: conexiones activas, salas y latencia.
