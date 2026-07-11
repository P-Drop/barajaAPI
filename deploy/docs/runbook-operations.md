# Runbook de Operaciones — barajaAPI (VPS clouding.io)

> Mantenimiento, despliegue y operación del sistema que sirve
> `api.pedrorincon.dev`, `baraja.pedrorincon.dev` y `grafana.pedrorincon.dev`.
> **Para vigilancia de seguridad y respuesta ante incidentes, ver
> [runbook-blue-team.md](./runbook-blue-team.md).**

## 0. Inventario del sistema

### Contenedores (docker compose en `~/baraja/`)

| Contenedor          | Imagen                       | Puerto (host)    | Función                                      |
| ------------------- | ---------------------------- | ---------------- | -------------------------------------------- |
| `baraja-api`        | `ghcr.io/p-drop/baraja-api`  | `127.0.0.1:3000` | API Express (actualiza el CD en cada merge)  |
| `baraja-prometheus` | `prom/prometheus:latest`     | `127.0.0.1:9090` | Scrape de `/metrics` cada 30 s (red interna) |
| `baraja-grafana`    | `grafana/grafana-oss:latest` | `127.0.0.1:3001` | Panel de control (vía Nginx)                 |

Todos con `restart: unless-stopped` y logs `json-file` rotados (3×10 MB).

### Subdominios (Nginx + Certbot)

| Dominio                   | Sirve                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.pedrorincon.dev`     | proxy → `127.0.0.1:3000` (`/metrics` bloqueado con 404)                                              |
| `baraja.pedrorincon.dev`  | estáticos `/var/www/baraja` (SPA, fallback `try_files`; caché: ver [http-cache.md](./http-cache.md)) |
| `grafana.pedrorincon.dev` | proxy → `127.0.0.1:3001` (con headers WebSocket)                                                     |

### Archivos y su fuente de verdad

| En el VPS                              | Versionado en el repo                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `~/baraja/docker-compose.yml`          | `deploy/docker-compose.prod.yml`                                             |
| `~/baraja/prometheus/prometheus.yml`   | `deploy/prometheus/prometheus.yml`                                           |
| `~/baraja/grafana/provisioning/`       | `deploy/grafana/provisioning/`                                               |
| `/etc/nginx/sites-available/*`         | `deploy/nginx/*.conf` (los tocan Certbot/admin: re-sincronizar tras cambios) |
| `~/baraja/.env.production` (chmod 600) | **NO versionado** (DATABASE_URL, CORS, etc.)                                 |
| `~/baraja/.env.grafana` (chmod 600)    | **NO versionado** (credenciales de Grafana)                                  |

### Volúmenes con estado

- `baraja_prometheus-data` — series temporales (retención 15d / 512 MB, lo que llegue antes).
- `baraja_grafana-data` — usuarios, dashboards creados por UI. **Borrar este volumen = resetear Grafana.**

## 1. Rutinas

### Diaria / tras un deploy (2 min)

```bash
docker ps                                                        # 3 contenedores "Up"
curl -sf https://api.pedrorincon.dev/api/health/ready && echo OK # API + BD
df -h /                                                          # disco < 80%
```

### Semanal (5 min)

```bash
free -h                                   # memoria (el stack añade ~300-450 MB)
docker system df                          # espacio de imágenes/volúmenes
sudo journalctl -p err -b | tail -20      # errores del sistema
docker image prune -f                     # limpia imágenes huérfanas del CD
```

### Mensual (15 min)

```bash
sudo certbot certificates && sudo certbot renew --dry-run   # los 3 certs renuevan solos; verificar
cd ~/baraja && docker compose pull && docker compose up -d  # actualizar el stack de observabilidad
                                                            # (Dependabot NO vigila imágenes del compose)
docker logs baraja-prometheus --since 24h | grep -i error   # salud del scrape
```

## 2. Operación del stack de observabilidad

### Arquitectura (quién habla con quién)

```
navegador ──HTTPS──► Nginx ──► grafana:3001 ──datasource──► prometheus:9090 ──scrape 30s──► api:3000/metrics
                                              (red interna de docker compose; nada de esto sale a internet)
```

### Acceso a la UI de Prometheus (no expuesta)

Túnel SSH — acceso admin sin abrir puertos:

```bash
ssh -L 9090:localhost:9090 <usuario>@<VPS>   # luego abrir http://localhost:9090 en local
```

### Doble login (basic auth de Nginx -> login de Grafana)

- Password de basic auth en `/etc/nginx/.htpasswd_grafana` (no versionado)
- Actualización mensual del stack es **también tarea de seguridad** (bootData anuncia `hasUpdate` con actualizaciones pendientes).

### Comprobaciones rápidas (desde el VPS)

```bash
curl -s localhost:9090/-/healthy                                   # Prometheus vivo
curl -s localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' # scrape "up"
curl -s localhost:3000/metrics | grep deck_operations              # la API expone métricas
curl -s -o /dev/null -w '%{http_code}\n' localhost:3001/login      # Grafana responde (200)
```

### Aplicar cambios de configuración

| Cambio                             | Cómo se aplica                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| `prometheus.yml`                   | `docker compose restart prometheus`                                               |
| Variables de entorno (`.env*`)     | `docker compose up -d --force-recreate <servicio>` (un `restart` NO relee el env) |
| `docker-compose.yml`               | `docker compose up -d` (recrea solo lo que cambió)                                |
| Server blocks de Nginx             | `sudo nginx -t && sudo systemctl reload nginx` (nunca sin `-t`)                   |
| Dashboards/datasources como código | archivo en `grafana/provisioning/` + `docker compose restart grafana`             |

### Resetear el password de admin de Grafana (sin perder datos)

```bash
docker exec baraja-grafana grafana cli admin reset-admin-password '<nuevo-password>'
```

> ⚠️ `GF_SECURITY_ADMIN_*` solo se aplican en el **primer arranque** (cuando se
> inicializa `grafana-data`). Después, la credencial vive en el volumen y el env
> se ignora: para cambiarla, usar el comando de arriba.

### Dashboards provisionados (como código)

- Fuente de verdad: `deploy/grafana/provisioning/dashboards/*.json` (repo) → copiado a `~/baraja/grafana/provisioning/dashboards/` en el VPS.

- Los dashboards provisionados son **de solo lectura en la UI**
  (`allowUiUpdates: false`). Para modificarlos: "Save as" a un borrador editable → iterar en la UI → exportar el JSON → reemplazar el archivo → `docker compose restart grafana` → borrar el borrador.

- Los paneles referencian el datasource por `uid: prometheus` (fijado en `datasources/prometheus.yml`): si ese uid cambia, todos los paneles caen con "datasource not found".

- **Alertas y contact points**: provisionados como código en `provisioning/alerting/` (solo lectura en la UI); el secreto del webhook se interpola vía `$DISCORD_WEBHOOK_URL` desde `.env.grafana`.viven en el volumen `grafana-data`; la fuente de verdad es el repo.

## 3. Gestión de logs

- La API loggea **JSON a stdout** (pino); Docker lo captura (`json-file`, rotado 3×10 MB por contenedor).
- Ver logs: `docker logs baraja-api --tail 50` · en vivo: `-f` · por tiempo: `--since 1h`.
- **Correlación por request-id** (un usuario reporta el `requestId` de un error 500):

  ```bash
  docker logs --since 24h baraja-api | grep '"id":"<request-id>"'
  ```

- Los health checks solo se loggean a nivel `debug` (invisibles con `LOG_LEVEL=info`); un health **fallido** sale como `error`.

## 4. Despliegues

- **Automático (CD):** cada merge a `main` → tests → imagen a GHCR → migraciones → `docker compose pull && up -d` de la API por SSH + `rsync` de los estáticos del front. Verificar después con la rutina diaria.
- **Manual (si hiciera falta):**

  ```bash
  cd ~/baraja && docker compose pull && docker compose up -d && docker image prune -f
  ```

- **Cambios de env de la API** (p. ej. `CORS_ORIGIN`): editar `.env.production` + `docker compose up -d --force-recreate api`.

## 5. Troubleshooting operativo

### A) "La API no responde / 502 Bad Gateway"

```bash
docker ps                                  # ¿baraja-api "Up"?
docker logs --tail 50 baraja-api
docker restart baraja-api
curl -i http://127.0.0.1:3000/api/health   # ¿responde la app directamente?
sudo nginx -t && sudo systemctl reload nginx
```

502 casi siempre = contenedor caído o que no escucha en 3000.

### B) "`/api/health/ready` da 503"

La readiness toca la BD. Causa típica: **Supabase free tier PAUSADO** tras ~1 semana inactivo.
→ Reactivar el proyecto en el dashboard de Supabase; revisar `docker logs baraja-api`.

### C) "Disco lleno"

```bash
df -h; sudo du -xh / | sort -rh | head -20
docker system prune -af                    # libera mucho (imágenes/caché)
sudo journalctl --vacuum-time=7d
docker system df -v                        # ¿engordó el volumen de Prometheus? (retención lo acota a 512 MB)
```

### D) "Certbot no renovó / SSL caducado"

```bash
sudo certbot renew --dry-run   # diagnóstico
sudo certbot renew && sudo systemctl reload nginx
```

Requisitos: puerto 80 abierto y DNS apuntando al VPS (nube gris en Cloudflare).

### E) "Grafana no carga o va sin datos"

```bash
docker logs --tail 50 baraja-grafana
curl -s localhost:3001/login -o /dev/null -w '%{http_code}\n'   # ¿200?
curl -s localhost:9090/api/v1/targets | grep health             # ¿el scrape está "up"?
```

Si el panel carga pero "no conecta en vivo": faltan los headers WebSocket
(`Upgrade`/`Connection`) en el server block de Nginx.

### F) "Prometheus target DOWN"

```bash
docker exec baraja-prometheus wget -qO- http://api:3000/metrics | head -3   # ¿la red interna llega?
docker logs --tail 30 baraja-prometheus
```

Si falla: ¿está `baraja-api` en el mismo compose/red? ¿cambió el nombre del servicio?
