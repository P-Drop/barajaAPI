# Changelog

Todas las novedades relevantes de este proyecto se documentan aquí.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y el proyecto sigue [Versionado Semántico](https://semver.org/lang/es):
**MAYOR** (cambios incompatibles de la API) · **MINOR** (funcionalidad retrocompatible) · **PATCH** (correcciones).

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
