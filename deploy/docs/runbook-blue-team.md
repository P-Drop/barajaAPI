# Runbook Blue Team — barajaAPI (VPS clouding.io)

> Mantenimiento, verificación y respuesta ante incidentes del servidor que sirve
> `https://api.pedrorincon.dev`. Pensado para un VPS de un solo administrador.

## 0. Filosofía y datos del sistema

- **El VPS es "ganado, no mascota":** el estado valioso vive **fuera** (BD en Supabase, código en Git, imagen en GHCR). Si algo va mal de verdad, **recrear** el VPS es más rápido y seguro que "limpiar". No le tengas miedo.
- **Tu defensa principal es el acceso SSH solo-por-clave.** Todo lo demás (fail2ban, puerto, etc.) es defensa en profundidad.
- **Inventario:**
  - SO: Ubuntu 24.04 LTS · usuario admin: `****` (sudo) · root y password SSH deshabilitados.
  - App: contenedor `baraja-api` (imagen `ghcr.io/p-drop/baraja-api`), escucha en `127.0.0.1:3000`.
  - Reverse proxy: Nginx (80/443) → `proxy_pass 127.0.0.1:3000`. SSL: Certbot (auto-renovación).
  - Firewall: `ufw` (22/80/443) + firewall de clouding + Anti-DDoS. Docker bindea a `127.0.0.1` (NO publicar en `0.0.0.0`).
  - Persistencia: `fail2ban`, `unattended-upgrades`, swap 2 GB.
  - Despliegue: `~/baraja/docker-compose.yml` (versionado en el repo como `deploy/docker-compose.prod.yml`) + `~/baraja/.env.production` (chmod 600, NO versionado); `docker login ghcr.io` con PAT `read:packages`.

---

## 1. Rutina de verificación

### Diaria / cuando notes algo raro (2 min)

```bash
who                      # ¿quién está conectado ahora? (solo tú)
last -aw | head          # logins EXITOSOS recientes (solo tú + reboots)
docker ps                # baraja-api "Up"; sin contenedores desconocidos
curl -sf https://api.pedrorincon.dev/api/health/ready && echo OK   # 200
df -h /                  # disco (que no llegue al 90%)
```

### Semanal (10 min)

```bash
sudo ss -tulpn                       # puertos a la escucha = solo 22/80/443 + 3000@127.0.0.1 + resolve/dhcp locales
awk -F: '$3==0 {print $1}' /etc/passwd   # UID 0 = solo "root"
getent group sudo                    # miembros de sudo = solo tú
sudo fail2ban-client status sshd     # que vigile y banee
free -h; uptime                      # memoria/carga
sudo journalctl -p err -b | tail -30 # errores del arranque actual
docker image prune -f                # limpia imágenes huérfanas (espacio)
```

### Mensual (15 min)

```bash
sudo apt update && apt list --upgradable     # parches pendientes
sudo unattended-upgrade --dry-run            # ¿se aplican solos los de seguridad?
sudo certbot certificates                    # caducidad del cert (renueva solo, pero comprueba)
sudo certbot renew --dry-run                 # simulacro de renovación
sudo crontab -l; ls -la /etc/cron.d          # ¿cron que tú no pusiste?
sudo find / -perm -4000 -type f 2>/dev/null  # binarios SUID (inventario base; vigila cambios)
```

---

## 2. Cómo interpretar las señales (normal vs sospechoso)

| Señal | ✅ Normal | 🚩 Investiga |
| ---------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- | --------------- |
| `lastb` lleno de intentos (mysql, admin, git…) | **Sí**, es ruido de bots constante en internet | (no aplica: son fallidos) |
| `last` (logins exitosos) | Solo tú + `reboot` | **Cualquier usuario/IP que no reconozcas** |
| Usuarios UID 0 | solo `root` | **cualquier otro** |
| Puertos a la escucha | 22, 80, 443, `127.0.0.1:3000`, resolve/dhcp locales | **puertos altos desconocidos, o 3000 en `0.0.0.0`** |
| Procesos top CPU | node, dockerd, nginx… | **procesos con nombres aleatorios, minado, CPU 100% sostenida** |
| Cron | qemu-guest-agent (clouding), certbot, apt… | \*\*scripts en `/tmp`, descargas con `curl                      | sh`, base64\*\* |
| `reboot` en `last` con kernel nuevo | Actualización de seguridad aplicada | reinicios que tú no provocaste y sin motivo |

---

## 3. Troubleshooting por caso

### A) "Veo muchísimos intentos en `lastb`"

Normal. Son bots. Confirma que **ninguno entró**: `last -aw | head`. Si solo estás tú → tranquilo. Tu clave los bloquea.

### B) "No puedo entrar por SSH" (te bloqueaste)

1. No cunda el pánico: usa la **consola web/KVM (VNC) de clouding.io** (acceso fuera de banda, no depende de SSH).
2. Desde ahí, revisa: `sudo systemctl status ssh`, `sudo ufw status`, `sudo sshd -t`, `/etc/ssh/sshd_config.d/`.
3. Regla de oro: al tocar SSH/ufw, **siempre** deja una sesión abierta y prueba la nueva en otra terminal **antes** de cerrar.

### C) "La API no responde / 502 Bad Gateway en Nginx"

```bash
docker ps                       # ¿está "Up" baraja-api?
docker logs --tail 50 baraja-api
docker restart baraja-api       # reinicio rápido
curl -i http://127.0.0.1:3000/api/health   # ¿responde la app directamente?
sudo nginx -t && sudo systemctl reload nginx
```

502 casi siempre = el contenedor está caído o no escucha en 3000.

### D) "`/api/health/ready` da 503"

La readiness toca la BD. Causa típica: **Supabase free tier PAUSADO** tras ~1 semana inactivo.

- Entra al dashboard de Supabase y reactiva el proyecto.
- Verifica también: `docker logs baraja-api` (errores de conexión/TLS).

### E) "Disco lleno (`No space left on device`)"

```bash
df -h; sudo du -xh / | sort -rh | head -20
docker system prune -af          # imágenes/contenedores/cache sin usar (libera mucho)
sudo journalctl --vacuum-time=7d # recorta logs del journal
```

### F) "fail2ban no banea nada (Total failed: 0)"

1. ¿Reinicio reciente? Solo cuenta desde el arranque (`uptime`).
2. ¿Lee el journal correcto?
   ```bash
   sudo fail2ban-client get sshd journalmatch
   journalctl _COMM=sshd -n 5 --no-pager
   ```
3. Asegura `backend = systemd` en `/etc/fail2ban/jail.local` y `sudo systemctl restart fail2ban`.

### G) "Quiero cambiar el puerto SSH" (Ubuntu 24.04 usa socket activation)

La directiva `Port` de `sshd_config` **se ignora**. Edita el socket:

```bash
sudo systemctl edit ssh.socket
# añade:
# [Socket]
# ListenStream=
# ListenStream=2222
sudo systemctl daemon-reload
sudo ufw allow 2222/tcp          # + abrir 2222 en el panel de clouding
sudo systemctl restart ssh.socket ssh
# CHECKPOINT en otra terminal: ssh -p 2222 tamariz@<IP>  (sin cerrar la actual)
# si entra: sudo ufw delete allow OpenSSH  (+ cerrar 22 en el panel)
```

Recuerda actualizar el CD (secreto `VPS_PORT`).

### H) "Certbot no renovó / SSL caducado"

```bash
sudo certbot renew --dry-run     # diagnóstico
sudo certbot renew               # forzar
sudo systemctl reload nginx
```

Requisito: puerto **80 abierto** y DNS apuntando al VPS (DNS-only en Cloudflare).

---

## 4. Respuesta ante incidente (sospecha real de compromiso)

Señales: usuario UID 0 nuevo, proceso de minado, puerto raro, binario SUID nuevo, login exitoso ajeno en `last`.

1. **No "limpies" un servidor comprometido** (nunca confías del todo en él). El VPS es ganado.
2. **Aísla:** `ufw default deny` o apaga la red desde el panel de clouding.
3. **Triage rápido** (para aprender qué pasó): `last`, `sudo ss -tunp`, `ps auxf`, `sudo journalctl -u ssh`, `sudo find / -newermt '-2 days' -type f 2>/dev/null | grep -v /proc`.
4. **Recrea desde cero** y **rota TODAS las credenciales**:
   - Password de la BD en Supabase (y nueva `DATABASE_URL`).
   - PAT de GHCR (`read:packages`).
   - Claves SSH (personal y de deploy del CD).
   - Cualquier secreto en GitHub Actions.
5. Vuelve a aplicar el hardening (ver §0) y re-despliega la imagen.

---

## 5. Endurecimiento aplicado (checklist de estado)

- [x] SSH solo por clave (root + password deshabilitados, `00-hardening.conf`)
- [x] `ufw` 22/80/443 (3000 NO expuesto) + firewall clouding + Anti-DDoS
- [x] Docker bindea la app a `127.0.0.1` (evita el bypass de ufw por Docker)
- [x] `fail2ban` (con `backend = systemd` + jail `recidive`)
- [x] `unattended-upgrades` (parches de seguridad automáticos)
- [x] Nginx + Certbot (HTTPS, redirección 80→443, auto-renovación)
- [x] `.env.production` y `~/.docker/config.json` con permisos 600
- [ ] (Opcional) puerto SSH alto vía `ssh.socket`
- [ ] (Opcional) PAT de GHCR con caducidad/rotación
- [ ] (Opcional) CrowdSec como complemento a fail2ban
