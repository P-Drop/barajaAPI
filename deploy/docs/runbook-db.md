# Runbook de Base de Datos — barajaAPI (Supabase)

> Gestión, seguridad, copias y troubleshooting de la base de datos de producción
> (PostgreSQL gestionado en Supabase). La operación del resto del stack vive en
> [runbook-operations.md](./runbook-operations.md); la vigilancia de seguridad y la
> respuesta ante incidentes, en [runbook-blue-team.md](./runbook-blue-team.md).

## 0. Inventario y modelo de acceso

- Proyecto Supabase (plan free) con PostgreSQL gestionado. La app usa **una única
  `DATABASE_URL`** en modo _Session_: la misma variable para runtime y migraciones.
- La **Data API (PostgREST) no se usa**: el único camino hacia la BD es Prisma desde la
  API.

| Quién conecta                               | Cuándo                                     | Credencial                                         |
| ------------------------------------------- | ------------------------------------------ | -------------------------------------------------- |
| API en producción (contenedor `baraja-api`) | Runtime                                    | `DATABASE_URL` en `~/baraja/.env.production` (VPS) |
| CD (GitHub Actions)                         | `prisma migrate deploy` en cada despliegue | Secret `DATABASE_URL` del repositorio              |
| Desarrollo y tests                          | **Nunca contra Supabase**                  | Postgres local (`docker compose up-d`)             |

## 1. Seguridad de acceso

- **Data API cerrada**: sin esquemas expuestos. Verificación: dashboard → Settings → API
  (la lista de _exposed schemas_ debe seguir vacía, o la Data API deshabilitada).
- **RLS (Row Level Security)**: Supabase lo activa automáticamente en cada tabla nueva
  (`rls_auto_enable`). No afecta a la API — el rol propietario de las tablas bypassa
  RLS — y bloquea cualquier acceso vía Data API sin políticas. Verificación periódica en
  el SQL Editor:

  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```

- **Claves `anon` / `service_role`**: la app no las usa. No copiarlas a ningún `.env`.
- **Rotación de la credencial de BD** (ante sospecha de exposición o por higiene):
  1. Dashboard → resetear la contraseña de la BD (invalida la URL anterior).
  2. Actualizar el secret `DATABASE_URL` en GitHub (Settings → Secrets → Actions).
  3. Actualizar `~/baraja/.env.production` en el VPS.
  4. `docker compose up -d --force-recreate baraja-api` (cambio de env ⇒ force-recreate).
  5. Verificar `/api/health/ready` → 200.

## 2. Backups y restore

- **Automáticos del plan**: plan free no incluye backups automáticos ni Point in Time Recovery.

- **Manual antes de migraciones delicadas** (destructivas o de gran volumen):

  ```bash
  pg_dump "$DATABASE_URL" --format=custom --file=baraja_$(date +%Y%m%d).dump
  ```

- **Restore** (contra una BD vacía o un proyecto nuevo):

  ```bash
  pg_restore --dbname="$DATABASE_URL_DESTINO" --clean --if-exists baraja_YYYYMMDD.dump
  ```

- Regla: **un backup no ensayado no cuenta**. Ensayar el restore al menos una vez (el
  Postgres local de Docker sirve como destino de prueba).

## 3. Migraciones en producción

- **Forward-only**: nunca editar ni rehacer una migración mergeada (misma regla que los
  commits).
- Las aplica el CD con `prisma migrate deploy`; la tabla `_prisma_migrations` es la
  fuente de verdad de lo aplicado.
- **Migración fallida a medias**: diagnosticar con los logs del job y el estado real del
  schema; marcar con `prisma migrate resolve --applied <nombre>` (si terminó de facto) o
  `--rolled-back <nombre>` (si se revirtió a mano) antes de re-desplegar.
- Cambios destructivos (DROP, renombrar columnas con datos): backup manual previo
  (sección 2) y, cuando sea posible, patrón expand → migrate → contract.

## 4. Rutinas y límites del plan free

Revisión mensual (junto a la rutina del VPS):

- [ ] Tamaño de la BD y distancia al límite del plan (dashboard → Usage).
- [ ] Conexiones activas: en modo _Session_ cada conexión cuenta; vigilar fugas.
- [ ] Logs de Postgres: buscar patrones nuevos no listados en la sección 5.
- [ ] Backups automáticos: comprobar que existen y son recientes.

Particularidades del free tier:

- **Pausa por inactividad**: los proyectos free se pausan sin tráfico. Hoy no ocurre
  porque UptimeRobot golpea `/api/health/ready` (→ `SELECT 1`) cada 5 minutos: **el
  monitoreo externo es también el keep-alive de la BD**. Si algún día se retira
  UptimeRobot, sustituir ese latido o asumir pausas.
- Supabase queda fuera de Dependabot y del compose del VPS: las actualizaciones del
  motor las gestiona el proveedor (managed).

## 5. Troubleshooting — patrones de log conocidos

| Patrón (logs de Postgres del dashboard)                                   | Significado                                                                                                | Acción                                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `schema "pg_pgrst_no_exposed_schemas" does not exist` (3F000, cada ~30 s) | PostgREST recargando su config con **cero esquemas expuestos**; el nombre es un centinela de "API cerrada" | Ninguna: benigno. Desaparece si se deshabilita la Data API por completo            |
| `checkpoint starting` / `checkpoint complete`                             | Ciclo normal de escritura del WAL                                                                          | Ninguna                                                                            |
| `statement: CREATE TABLE ...` u otro DDL                                  | Migración aplicada por el CD                                                                               | Correlarlo con el despliegue correspondiente                                       |
| `rls_auto_enable: enabled RLS on public."<Tabla>"`                        | Tabla nueva protegida automáticamente                                                                      | Verificar que la API sigue operando (owner bypass) y anotar la tabla               |
| `too many connections`                                                    | Cupo de conexiones agotado (modo _Session_)                                                                | Revisar conexiones en el dashboard; reiniciar `baraja-api` si la fuga es de la app |
| La BD no responde y el proyecto figura "Paused"                           | Pausa por inactividad del free tier                                                                        | Reanudar desde el dashboard; investigar por qué faltó el keep-alive (sección 4)    |
