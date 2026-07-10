# Runbook Blue Team — barajaAPI (VPS clouding.io)

> Vigilancia de seguridad y respuesta ante incidentes del servidor.
> **Para mantenimiento, despliegues y operación del stack, ver
> [runbook-operations.md](./runbook-operations.md)** (inventario completo allí).

## 0. Filosofía

- **El VPS es "ganado, no mascota":** el estado valioso vive **fuera** (BD en Supabase, código en Git, imagen en GHCR, configs versionadas en `deploy/`). Si algo va mal de verdad, **recrear** el VPS es más rápido y seguro que "limpiar". No le tengas miedo.
- **Tu defensa principal es el acceso SSH solo-por-clave.** Todo lo demás (fail2ban, firewall, binds a localhost) es defensa en profundidad.
- Superficie expuesta a internet: **solo 22, 80 y 443**. Todo lo interno (API :3000, Prometheus :9090, Grafana :3001) bindea a `127.0.0.1` y sale únicamente a través de Nginx.

## 1. Rutina de vigilancia

### Diaria / cuando notes algo raro (2 min)

```bash
who                      # ¿quién está conectado ahora? (solo tú)
last -aw | head          # logins EXITOSOS recientes (solo tú + reboots)
docker ps                # sin contenedores desconocidos
```

### Semanal (10 min)

```bash
sudo ss -tulpn                           # puertos a la escucha = solo 22/80/443 + 3000/9090/3001 en 127.0.0.1 + resolve/dhcp
awk -F: '$3==0 {print $1}' /etc/passwd   # UID 0 = solo "root"
getent group sudo                        # miembros de sudo = solo tú
sudo fail2ban-client status sshd         # que vigile y banee
```

### Mensual (15 min)

```bash
sudo apt update && apt list --upgradable     # parches pendientes
sudo unattended-upgrade --dry-run            # ¿se aplican solos los de seguridad?
sudo crontab -l; ls -la /etc/cron.d          # ¿cron que tú no pusiste?
sudo find / -perm -4000 -type f 2>/dev/null  # binarios SUID (vigila cambios vs inventario)
```

## 2. Cómo interpretar las señales (normal vs sospechoso)

| Señal                                          | ✅ Normal                                                | 🚩 Investiga                                                      |
| ---------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `lastb` lleno de intentos (mysql, admin, git…) | **Sí**, es ruido de bots constante en internet           | (no aplica: son fallidos)                                         |
| `last` (logins exitosos)                       | Solo tú + `reboot`                                       | **Cualquier usuario/IP que no reconozcas**                        |
| Usuarios UID 0                                 | solo `root`                                              | **cualquier otro**                                                |
| Puertos a la escucha                           | 22/80/443 públicos; 3000, 9090, 3001 SOLO en `127.0.0.1` | **puertos altos desconocidos, o servicios internos en `0.0.0.0`** |
| Procesos top CPU                               | node, dockerd, nginx, prometheus, grafana…               | **procesos con nombres aleatorios, minado, CPU 100% sostenida**   |
| Cron                                           | qemu-guest-agent (clouding), certbot, apt…               | **scripts en `/tmp`, descargas con `curl \| sh`, base64**         |
| `reboot` en `last` con kernel nuevo            | Actualización de seguridad aplicada                      | reinicios que tú no provocaste y sin motivo                       |
| Métricas (Grafana)                             | tráfico y `unmatched` moderados (bots probando URLs)     | **picos anómalos sostenidos de `unmatched` o de 4xx/429**         |

## 3. Casos de seguridad

### A) "Veo muchísimos intentos en `lastb`"

Normal. Son bots. Confirma que **ninguno entró**: `last -aw | head`. Si solo estás tú → tranquilo. Tu clave los bloquea.

### B) "No puedo entrar por SSH" (te bloqueaste)

1. No cunda el pánico: usa la **consola web/KVM (VNC) de clouding.io** (acceso fuera de banda, no depende de SSH).
2. Desde ahí, revisa: `sudo systemctl status ssh`, `sudo ufw status`, `sudo sshd -t`, `/etc/ssh/sshd_config.d/`.
3. Regla de oro: al tocar SSH/ufw, **siempre** deja una sesión abierta y prueba la nueva en otra terminal **antes** de cerrar.

### C) "fail2ban no banea nada (Total failed: 0)"

1. ¿Reinicio reciente? Solo cuenta desde el arranque (`uptime`).
2. ¿Lee el journal correcto?
   ```bash
   sudo fail2ban-client get sshd journalmatch
   journalctl _COMM=sshd -n 5 --no-pager
   ```
3. Asegura `backend = systemd` en `/etc/fail2ban/jail.local` y `sudo systemctl restart fail2ban`.

> jails de archivo (nginx): el `backend = systemd` global no es válido para nginx-http-auth -> override con `backend = polling` + `logpath`.

### D) "Quiero cambiar el puerto SSH" (Ubuntu 24.04 usa socket activation)

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
# CHECKPOINT en otra terminal: ssh -p 2222 <usuario>@<IP>  (sin cerrar la actual)
# si entra: sudo ufw delete allow OpenSSH  (+ cerrar 22 en el panel)
```

Recuerda actualizar el CD (secreto `VPS_PORT`).

## 4. Respuesta ante incidente (sospecha real de compromiso)

Señales: usuario UID 0 nuevo, proceso de minado, puerto raro, binario SUID nuevo, login exitoso ajeno en `last`.

1. **No "limpies" un servidor comprometido** (nunca confías del todo en él). El VPS es ganado.
2. **Aísla:** `ufw default deny` o apaga la red desde el panel de clouding.
3. **Triage rápido** (para aprender qué pasó): `last`, `sudo ss -tunp`, `ps auxf`, `sudo journalctl -u ssh`, `sudo find / -newermt '-2 days' -type f 2>/dev/null | grep -v /proc`.
4. **Recrea desde cero** y **rota TODAS las credenciales**:
   - Password de la BD en Supabase (y nueva `DATABASE_URL`).
   - PAT de GHCR (`read:packages`).
   - Claves SSH (personal y de deploy del CD).
   - Credenciales de Grafana (`.env.grafana` + reset en el volumen) y DSN de Sentry si existe.
   - Cualquier secreto en GitHub Actions.
5. Vuelve a aplicar el hardening (ver §5) y re-despliega desde las configs versionadas (`deploy/`).

## 5. Endurecimiento aplicado (checklist de estado)

- [x] SSH solo por clave (root + password deshabilitados, `00-hardening.conf`)
- [x] `ufw` 22/80/443 (nada interno expuesto) + firewall clouding + Anti-DDoS
- [x] Docker bindea todo a `127.0.0.1` (API, Prometheus, Grafana) — evita el bypass de ufw por Docker
- [x] `fail2ban` (con `backend = systemd` + jail `recidive`)
- [x] `unattended-upgrades` (parches de seguridad automáticos)
- [x] Nginx + Certbot (HTTPS y redirección 80→443 en los 3 subdominios; auto-renovación)
- [x] `/metrics` bloqueado públicamente (404 en Nginx); scrape solo por red interna
- [x] Grafana: registro deshabilitado (`GF_USERS_ALLOW_SIGN_UP=false`), password fuerte, sin exposición directa
- [x] `.env.production`, `.env.grafana` y `~/.docker/config.json` con permisos 600
- [x] Grafana tras doble puerta: `auth_basic` de Nginx (credencial independiente) + jail `nginx-http-auth` de fail2ban
- [x] Versión/build de Grafana ocultos a anónimos (`GF_AUTH_ANONYMOUS_HIDE_VERSION=true`; verificado: bootData sin versionString)
- [x] `server_tokens off` en nginx.conf (no versionado - aplicar a mano si se recrea el VPS)
- [ ] (Opcional) puerto SSH alto vía `ssh.socket`
- [ ] (Opcional) PAT de GHCR con caducidad/rotación
- [ ] (Opcional) CrowdSec como complemento a fail2ban
- [ ] (Opcional) **Clave SSH dedicada y restringida para el deploy del front** (mínimo privilegio):
      generar un par solo para el CI (secreto nuevo, p. ej. `VPS_SSH_KEY_WEB`) y atar la clave
      pública en `authorized_keys` a un único comando:
      `command="rrsync /var/www/baraja",restrict ssh-ed25519 AAAA... deploy-web-ci`.
      Daño máximo si se filtra = sobrescribir los estáticos del front. La clave del deploy
      de la **API** no admite esta restricción (ejecuta `docker compose`); valorar separarla
      del usuario admin.
