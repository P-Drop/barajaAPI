# Changelog

Todas las novedades relevantes de este proyecto se documentan aquí.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es):
**MAYOR** (cambios incompatibles de la API) · **MINOR** (funcionalidad retrocompatible) · **PATCH** (correcciones).

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
