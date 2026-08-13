# Changelog

Todas las novedades relevantes de este proyecto se documentan aquí.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es):
**MAYOR** (cambios incompatibles de la API) · **MINOR** (funcionalidad retrocompatible) · **PATCH** (correcciones).

## [1.3.0](https://github.com/P-Drop/barajaAPI/compare/v1.2.0...v1.3.0) (2026-08-13)


### Features

* **api:** comodines, escalera mecánica y puntuación del Solitario Orda (F5-5) ([#127](https://github.com/P-Drop/barajaAPI/issues/127)) ([131f1b2](https://github.com/P-Drop/barajaAPI/commit/131f1b20b1f53c4934895a813e73ceca6bc0f85f))
* **api:** gestor de partidas del Solitario Orda (F5-6) ([#129](https://github.com/P-Drop/barajaAPI/issues/129)) ([eb276e8](https://github.com/P-Drop/barajaAPI/commit/eb276e8c4e5af7f92e7551b990efd12e7f1026c9))
* **api:** login con JWT y middleware de autenticación (F5-3) ([#122](https://github.com/P-Drop/barajaAPI/issues/122)) ([5f3a1f6](https://github.com/P-Drop/barajaAPI/commit/5f3a1f6dfecdc369cdad5aa801b255d879e0e45d))
* **api:** métricas del Solitario Orda y rate limiting por jugador (F5-11) ([#143](https://github.com/P-Drop/barajaAPI/issues/143)) ([dac04e9](https://github.com/P-Drop/barajaAPI/commit/dac04e9343adf1b238f1fba72d7b90c4452df1de))
* **api:** motor de reglas del Solitario Orda (F5-4) ([#124](https://github.com/P-Drop/barajaAPI/issues/124)) ([6460705](https://github.com/P-Drop/barajaAPI/commit/6460705298cd53a6a139fd715be767722f36f210))
* **api:** perfil del jugador y ranking del Solitario Orda (F5-7) ([#132](https://github.com/P-Drop/barajaAPI/issues/132)) ([b0c103f](https://github.com/P-Drop/barajaAPI/commit/b0c103f87dd8ab118a060007037516ed2d03c8e6))
* **api:** registro de usuarios con nickname anónimo (F5-2) ([#115](https://github.com/P-Drop/barajaAPI/issues/115)) ([92f7bde](https://github.com/P-Drop/barajaAPI/commit/92f7bdec12e680c063fe920660a5c7bcec5b94d6))
* **web:** comodines, movimiento en bloque y ranking del Solitario Orda (F5-10) ([#141](https://github.com/P-Drop/barajaAPI/issues/141)) ([446dcfb](https://github.com/P-Drop/barajaAPI/commit/446dcfb5c9a9b526d3ff96579ac97241f322e1dc))
* **web:** tablero jugable del Solitario Orda (F5-9) ([#139](https://github.com/P-Drop/barajaAPI/issues/139)) ([d9f35bb](https://github.com/P-Drop/barajaAPI/commit/d9f35bb69736df34d727a5db6848ec2edda65b0a))


### Bug Fixes

* **api:** mapear errores transitorios de Prisma a 503 y afinar el pooler de conexión ([#142](https://github.com/P-Drop/barajaAPI/issues/142)) ([5fe2ba8](https://github.com/P-Drop/barajaAPI/commit/5fe2ba868cb50ed8348474f98a004e9648895071))
* **api:** validar el avatar contra la lista cerrada de assets ([8e7b251](https://github.com/P-Drop/barajaAPI/commit/8e7b2519a0627a0ff9c49f4746c81ebdb8ac5b1f))
* **docs:** usa URL de servidor relativa en el spec OpenAPI ([#130](https://github.com/P-Drop/barajaAPI/issues/130)) ([6b8ce82](https://github.com/P-Drop/barajaAPI/commit/6b8ce820570ca77156b9abbfbdf9f6f06b32252c))

## [1.2.0](https://github.com/P-Drop/barajaAPI/compare/v1.1.0...v1.2.0) (2026-07-11)


### Features

* **api:** méticas prometheus en la api ([#90](https://github.com/P-Drop/barajaAPI/issues/90)) ([f2a8cb3](https://github.com/P-Drop/barajaAPI/commit/f2a8cb3f8846a09d9d7f0b18ffdae9b38be51627))
* **api:** trazabilidad de peticiones con request-id ([#89](https://github.com/P-Drop/barajaAPI/issues/89)) ([72fea61](https://github.com/P-Drop/barajaAPI/commit/72fea617ec858603ef1ee12c4e9db94f4421eecf))
* **deploy:** panel de control de Grafana y alertas ([#97](https://github.com/P-Drop/barajaAPI/issues/97)) ([115e244](https://github.com/P-Drop/barajaAPI/commit/115e2441ace0c3af3c1af940283e891afc4c8133))
* **deploy:** stack de observabilidad Prometheus + Grafana en el VPS ([#91](https://github.com/P-Drop/barajaAPI/issues/91)) ([6d4dfbd](https://github.com/P-Drop/barajaAPI/commit/6d4dfbd83c69957987e761e5144acdd19e06682b))
* registro de errores centralizado con Sentry (API + front) ([#92](https://github.com/P-Drop/barajaAPI/issues/92)) ([cf6f2c0](https://github.com/P-Drop/barajaAPI/commit/cf6f2c0da299718b79d11914d2ecb3d63e613020))
* Sentry con release tracking y source maps; alerting como código ([#98](https://github.com/P-Drop/barajaAPI/issues/98)) ([7e31fec](https://github.com/P-Drop/barajaAPI/commit/7e31fec1cbabab573b908b9903154ac02ff8d198))


### Bug Fixes

* configurar enlace a imagen en README ([#101](https://github.com/P-Drop/barajaAPI/issues/101)) ([56b80fc](https://github.com/P-Drop/barajaAPI/commit/56b80fc7c2d6a2d970f30112668acea4655659fc))

## [1.1.0](https://github.com/P-Drop/barajaAPI/compare/barajaapi-v1.0.0...barajaapi-v1.1.0) (2026-07-05)


### Features

* test del frontend en CI y CORS estricto en la API ([#77](https://github.com/P-Drop/barajaAPI/issues/77)) ([8d59273](https://github.com/P-Drop/barajaAPI/commit/8d59273269d2802226c282429c6e478bdf1dc45e))
* **web:** assets gráficos de la baraja y render con &lt;Card&gt; ([#68](https://github.com/P-Drop/barajaAPI/issues/68)) ([994339b](https://github.com/P-Drop/barajaAPI/commit/994339be8ce15725c73677ed5bfc60acf3d8cc52))
* **web:** cliente tipado de la API y render de la baraja ([#67](https://github.com/P-Drop/barajaAPI/issues/67)) ([5b81589](https://github.com/P-Drop/barajaAPI/commit/5b8158972557c8d9b4dd8b017783f3c9cc84485f))
* **web:** UI para visualizar y barajar la baraja española ([#73](https://github.com/P-Drop/barajaAPI/issues/73)) ([4b55a84](https://github.com/P-Drop/barajaAPI/commit/4b55a8481965edc04a47ec9827743e8c6a9525d9))


### Bug Fixes

* configurar issue template ([#7](https://github.com/P-Drop/barajaAPI/issues/7)) ([6953c4d](https://github.com/P-Drop/barajaAPI/commit/6953c4da00553ebeea371b04f06fc213bc606f6a))
* configurar issue template según requerimientos de github, eliminar configuración legacy ([6953c4d](https://github.com/P-Drop/barajaAPI/commit/6953c4da00553ebeea371b04f06fc213bc606f6a))
* DATABASE_URL placeholder en el build de la imagen Docker ([#41](https://github.com/P-Drop/barajaAPI/issues/41)) ([052166b](https://github.com/P-Drop/barajaAPI/commit/052166b8f0a5fc989b4119f4b4844c17f95f52fa))


### Performance Improvements

* **web:** optimizar imágenes y caché de estáticos ([#78](https://github.com/P-Drop/barajaAPI/issues/78)) ([0d3ed3f](https://github.com/P-Drop/barajaAPI/commit/0d3ed3f3fb64113925ae0dd3c9a32d317e210d0e))

## [1.0.0] - 2026-06-29

Primer release estable: API pública, segura y desplegada en producción.

### Added

- Despliegue en producción: VPS (clouding.io) con Nginx + Certbot (HTTPS) y dominio `api.pedrorincon.dev`.
- Base de datos de producción gestionada (Supabase, PostgreSQL).
- Pipeline de **CD** (GitHub Actions): test → build → migraciones → deploy por SSH.
- Imagen **Docker** multi-stage publicada en GHCR.
- **Rate limiting** por IP en `/api/v1` (configurable por entorno).
- **Dependabot** para npm, GitHub Actions y Docker.
- **Cobertura de tests** con umbrales verificados en CI.

### Changed

- `trust proxy` habilitado (IP real del cliente tras Nginx).
- Build de producción autocontenido (se incluye el query engine de Prisma en `dist`).

### Security

- Hardening del servidor (SSH solo por clave, `ufw`, `fail2ban`, actualizaciones automáticas).

## [0.1.0] - 2026-06-21

MVP de la baraja española.

### Added

- Endpoints `/api/v1`: baraja completa (50 / 40), barajar y robar N cartas.
- Validación con Zod y manejo de errores centralizado (`DomainError`).
- Documentación OpenAPI/Swagger generada desde los schemas.
- Logger estructurado (pino) y health check de readiness.
- Tests e2e (mockeados) y de integración con PostgreSQL en el CI.

[1.0.0]: https://github.com/P-Drop/barajaAPI/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/P-Drop/barajaAPI/releases/tag/v0.1.0
