# Runbook de Mantenimiento del SO — VPS barajaAPI

> Actualización, parcheo y reinicio del **sistema operativo** del VPS
> (`barajaserver`, Ubuntu 24.04 LTS en clouding.io).
> Para operación del stack y despliegues, ver [runbook-operations.md](./runbook-operations.md).
> Para vigilancia de seguridad e incidentes, ver [runbook-blue-team.md](./runbook-blue-team.md).

## 0. Modelo mental: dos superficies de parcheo independientes

La confusión más cara de este sistema es creer que actualizar el host parchea todo.
No es así: **son dos mundos separados que se mantienen por vías distintas.**

| Superficie                | Qué contiene                                    | Cómo se parchea                                                | Quién lo vigila                                     |
| ------------------------- | ----------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| **Host** (Ubuntu del VPS) | kernel, glibc, OpenSSH, Nginx, Docker, fail2ban | `apt upgrade` + reinicio (este runbook)                        | `unattended-upgrades` + Ubuntu Pro                  |
| **Imágenes Docker**       | Node, glibc/musl y libs **dentro** de la imagen | reconstruir imagen (`Dockerfile` base) o `docker compose pull` | Dependabot (api) / **manual** (Prometheus, Grafana) |

Corolario: cuando `needrestart` dice _"No containers need to be restarted"_ **no está
diciendo que los contenedores estén parcheados** — dice que ningún proceso dentro de
ellos usa bibliotecas del host. Una imagen lleva su propia copia de todo.

> ⚠️ Prometheus y Grafana van a `:latest` y **Dependabot no vigila el compose**.
> Su actualización es la rutina mensual de [runbook-operations.md](./runbook-operations.md#mensual-15-min).

## 1. Inventario relevante del SO

| Elemento                    | Valor                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| Distribución                | Ubuntu 24.04 LTS (noble), serie de kernel `6.8.0-*-generic`                |
| Disco                       | `/dev/sda2`, 20 GB, **sin partición `/boot` separada**                     |
| Suscripción                 | Ubuntu Pro — free personal (esm-infra, esm-apps, livepatch)                |
| Actualizaciones automáticas | `unattended-upgrades` (solo seguridad; **no** reinicia solo)               |
| DNS                         | `systemd-resolved` en modo stub → 8.8.8.8 / 8.8.4.4, sin DNSSEC (§7)       |
| Watchdog                    | sin `/dev/watchdog` en la VM; paquete `watchdog` deshabilitado (§7)        |
| Servicios deshabilitados    | `unbound`, `unbound-resolvconf`, `watchdog` — instalados, no purgados (§7) |

Sin `/boot` separado no existe el fallo clásico de "`/boot` lleno rompe APT", pero cada
kernel retenido ocupa ~350–500 MB del root de 20 GB compartido con las imágenes de Docker.
Vigilar con `df -h /` y limpiar con `apt autoremove --purge` (§4).

## 2. Rutina mensual de actualización del SO (10 min)

```bash
sudo apt update
apt list --upgradable                  # leer ANTES de aplicar
sudo apt upgrade
```

Al terminar, `needrestart` imprime un informe. Interpretarlo con §3.

```bash
sudo pro security-status                        # cobertura por canal (main/universe/ESM)
sudo canonical-livepatch status                 # parches en caliente del kernel vivo
cat /var/run/reboot-required.pkgs 2>/dev/null   # ¿qué exige reiniciar?
```

Si aparece `reboot-required`, programar el reinicio de §5. No hay prisa de minutos, pero
tampoco se deja indefinidamente: mientras no se reinicie, **los procesos vivos siguen
ejecutando los binarios viejos**, vulnerabilidad incluida.

## 3. Cómo leer el informe de `needrestart`

`needrestart` compara los binarios y bibliotecas **en disco** con los que los procesos
tienen **mapeados en memoria**. Cada bloque de su salida significa algo distinto:

| Bloque                                          | Significado                                                                 | Acción                     |
| ----------------------------------------------- | --------------------------------------------------------------------------- | -------------------------- |
| `currently running kernel ... not the expected` | Kernel nuevo en `/boot`, viejo en RAM                                       | **Reiniciar** (§5)         |
| `Restarting services...`                        | Demonios sin sesiones colgando; ya reiniciados solos                        | Ninguna                    |
| `Service restarts being deferred`               | `dbus`, `systemd-logind`, `getty@`… reiniciarlos en caliente rompe sesiones | Se resuelven con el reboot |
| `No containers need to be restarted`            | Nada dentro de los contenedores usa libs del host                           | Ninguna (**ver §0**)       |
| `User sessions running outdated binaries`       | La sesión SSH actual arrancó con el `sshd` anterior                         | Se resuelve al reconectar  |

### El paquete que más importa: `libc6`

Si `libc6` (glibc) aparece en `/var/run/reboot-required.pkgs`, **casi todo proceso del
sistema la tiene mapeada**. Es la causa típica de que needrestart quiera reiniciar media
máquina, y el caso que Livepatch **no** cubre (§6). Reinicio obligatorio.

### Un `Job for <servicio> canceled` no es necesariamente un fallo

systemd cancela jobs encolados cuando otra unidad con `Conflicts=` gana la carrera, o cuando
un `OnFailure=` arranca un servicio incompatible. Antes de dar por rota una unidad:

```bash
systemctl status <servicio> --no-pager
journalctl -u <servicio> -b --no-pager | tail -20
```

## 4. Limpieza de kernels y espacio

```bash
sudo apt autoremove --purge     # leer la lista antes de confirmar
df -h /
docker system df                # si el root crece, suele ser Docker, no kernels
```

> **El orden importa.** APT nunca purga el kernel en ejecución. Lanzado _antes_ del reboot,
> el kernel viejo está protegido y sobrevive; lanzado _después_, ya es prescindible y se va.
> Por eso la limpieza va en el post-reinicio (§5), no en el pre.

### Por qué `autoremove` deja siempre un kernel viejo "sin limpiar"

No es un fallo. `/etc/kernel/postinst.d/apt-auto-removal` regenera en cada instalación de
kernel la lista `/etc/apt/apt.conf.d/01autoremove-kernels`, que protege **el kernel en
ejecución, el más reciente instalado y el inmediatamente anterior**. Es una red de seguridad
deliberada: si el kernel nuevo no arrancase, hace falta el anterior en el menú de GRUB.

Tras un salto de versión quedan por tanto **dos** kernels en disco. El viejo desaparece solo
con la siguiente actualización, cuando pasa a ser el tercero de la lista.

> ⚠️ **No forzar con `apt purge linux-image-<viejo>`** salvo emergencia real de disco:
> se ganan ~300 MB a cambio de quedarse sin kernel de respaldo para arrancar.

Si el root aprieta, el culpable habitual son las imágenes huérfanas que deja el CD en cada
merge: `docker image prune -f` (ver troubleshooting C de [runbook-operations.md](./runbook-operations.md)).

## 5. Reinicio planificado

Downtime esperado: **1–2 minutos**. Sin riesgo de datos: la BD vive en Supabase (externa),
Prometheus y Grafana persisten en volúmenes nombrados.

### Antes

```bash
systemctl is-enabled docker                      # CRÍTICO: "enabled" o el stack no vuelve
sudo apt update && sudo apt upgrade              # agrupar todo en un solo reinicio
docker ps --format '{{.Names}}\t{{.Status}}'     # foto para comparar después
```

Los tres contenedores tienen `restart: unless-stopped` en `deploy/docker-compose.prod.yml`:
con `docker.service` habilitado vuelven solos, sin intervención.

**Avisos que se dispararán** (decidir si silenciarlos o aceptarlos):

- **UptimeRobot** registrará el downtime en el histórico.
- **Grafana → Discord**: la alerta _API caída_ usa `noDataState: Alerting` con `for: 1m`.
  Grafana está caído durante el reinicio, así que no evalúa; el riesgo real es la ventana de
  arranque, si Grafana levanta antes de que Prometheus tenga un scrape fresco de la API.
  Para silenciar: crear un _Silence_ en la UI (es estado de runtime en `grafana-data`,
  no está provisionado, y sobrevive al reboot).

### Reiniciar

```bash
sudo reboot
```

### Después

```bash
uname -r                                     # la versión esperada
sudo canonical-livepatch status --verbose    # kernel cubierto, sin errores
sudo pro status                              # esm-infra / esm-apps / livepatch enabled

sudo systemctl status nginx --no-pager
sudo fail2ban-client status                  # ¿volvieron las 3 jails?

docker ps                                                        # 3 contenedores "Up"
curl -sf https://api.pedrorincon.dev/api/health/ready && echo OK

sudo journalctl -p err -b --no-pager         # objetivo: vacío (§7)
ls /var/run/reboot-required 2>/dev/null || echo "sin reboot pendiente"
df -h /
```

Después, la limpieza de §4. Y en Grafana, confirmar que Prometheus recuperó el scrape:
recordar que **los counters de la API se reinician con el contenedor** — leerlos siempre con
`increase()` o `rate()`, nunca en valor absoluto.

## 6. Ubuntu Pro: qué cubre cada servicio

Suscripción _free personal_ (hasta 5 máquinas). Servicios habilitados:

| Servicio      | Cubre                                                                   | ¿Evita reiniciar? |
| ------------- | ----------------------------------------------------------------------- | ----------------- |
| **livepatch** | CVEs de severidad alta/crítica del **kernel en ejecución**, en caliente | Solo el kernel    |
| **esm-infra** | Paquetes de `main`, soporte extendido más allá del ciclo estándar       | No                |
| **esm-apps**  | Paquetes de `universe` — sin soporte de seguridad estándar de Canonical | No                |

Tres cosas que no son evidentes:

**1. Livepatch no sustituye a los reinicios.** Solo toca el kernel. Cualquier actualización de
espacio de usuario (`libc6`, OpenSSL, Nginx, OpenSSH) sigue exigiendo reiniciar procesos o la
máquina. Livepatch compra **tiempo** frente a CVEs de kernel, no inmunidad al reboot.

**2. Livepatch trabaja sobre el kernel que está corriendo**, no sobre el instalado. Si se
arrastra un kernel muy atrasado, puede no haber parches aplicables para él. Reiniciar al kernel
nuevo _primero_ y dejar que Livepatch tome esa base.

**3. Que ESM no ofrezca nada no significa que esté mal configurado.** Con 24.04 dentro de su
ventana de soporte estándar, `esm-infra` aún no tiene trabajo; `esm-apps` solo actúa cuando un
paquete de `universe` instalado recibe parche. El valor es que estará ahí sin intervención.
La configuración se verifica en la salida de `apt update`: deben aparecer los cuatro repos
`esm.ubuntu.com` (`noble-apps-security/updates`, `noble-infra-security/updates`).

### Cómo leer `canonical-livepatch status`

```
kernel state:  ✓ kernel series 6.8 is covered by Livepatch
patch state:   ✓ no livepatches available for kernel 6.8.0-137.137-generic
tier: updates (Free usage; This machine beta tests new patches.)
```

- **`no livepatches available` es buena señal**, no un fallo: con el kernel recién actualizado
  no hay CVEs pendientes de parchear en caliente. Livepatch queda de guardia.
- **`tier: updates` = banco de pruebas.** El plan gratuito recibe los livepatches **antes** que
  los clientes de pago. Riesgo bajo, pero es el trato del plan y conviene saberlo.
- Si `kernel state` dijera que la serie no está cubierta, reiniciar al kernel más reciente
  instalado suele resolverlo (§8-D).

### Verificación de la integración con `unattended-upgrades`

Que Pro funcione en piloto automático depende de que los orígenes ESM estén permitidos:

```bash
grep -A12 'Allowed-Origins\|Origins-Pattern' /etc/apt/apt.conf.d/50unattended-upgrades
```

Deben aparecer entradas `ESMApps` y `ESM` junto a las de `-security`.

```bash
sudo unattended-upgrade --dry-run --debug | tail -30   # qué aplicaría ahora mismo
```

## 7. Higiene: el journal de errores como señal

El objetivo permanente es que **`sudo journalctl -p err -b` salga vacío**. No es cosmética: ese
comando está en la rutina **semanal** de
[runbook-operations.md](./runbook-operations.md#semanal-5-min). Si cada arranque lo llena con las
mismas líneas conocidas, deja de funcionar como señal y un error real queda enterrado bajo el
ruido habitual.

> ⚠️ `-b` significa **el arranque actual**. Tras deshabilitar un servicio ruidoso, sus errores
> siguen apareciendo hasta el siguiente reinicio: son historia de este boot, no estado presente.
> Para comprobar el efecto sin reiniciar: `sudo journalctl -p err --since "30 min ago"`.

### Auditoría periódica de servicios

```bash
systemctl list-units --state=failed          # unidades caídas
systemctl list-units --type=service --state=running | wc -l
sudo journalctl -p err -b --no-pager
```

### Criterio para decidir sobre un servicio heredado de la plantilla

La imagen base del proveedor trae demonios que este proyecto no usa. **Instalado y arrancado no
es lo mismo que en uso.** Tres preguntas, en este orden:

1. **¿Está en el camino de algo que funcione hoy?** Se comprueba con datos, no por el nombre del
   servicio (p. ej. `resolvectl status` dice qué resolver DNS se usa realmente).
2. **¿Qué se rompe exactamente si lo quito?** Si la respuesta es "nada", el precio es cero.
3. **¿Esa función ya está cubierta en otra capa?** La recuperación de la API, por ejemplo, ya la
   dan `restart: unless-stopped` de Docker, la alerta de Grafana y UptimeRobot.

Con "nada / nada / sí", la decisión es quitarlo. **"Por si acaso" no es un argumento**: un
servicio que aparenta una garantía sin darla induce a error al leer el inventario meses después.
Aplicando este criterio se deshabilitaron `unbound` (no era el resolver: el DNS lo sirve
`systemd-resolved`) y `watchdog` (sin `/dev/watchdog` en la VM y sin comprobaciones configuradas).

```bash
sudo systemctl disable --now <servicio>      # reversible: el paquete sigue instalado
sudo systemctl mask <servicio>               # si una actualización lo reactiva
sudo systemctl is-enabled <servicio>         # verificar: "disabled"
```

> Se optó por **deshabilitar y no purgar**: es reversible en un comando y evita que `apt`
> arrastre dependencias inesperadas. El coste es unos MB en disco y que sigan apareciendo en
> `dpkg -l`, así que el inventario (§1) es la fuente de verdad sobre qué está apagado a propósito.

Añadir siempre un servicio con dependencias de red (`unbound`, proxies, resolvers) implica crear
un **punto único de fallo nuevo**: si cae, la API pierde Supabase. Solo compensa si aporta algo
que hoy falte de verdad.

### Pendiente: DNSSEC y DNS cifrado

Hoy `resolvectl` reporta `DNSSEC=no/unsupported` y todas las consultas van a Google. Ambas cosas
se corrigen en `systemd-resolved`, sin instalar servicios nuevos, en `/etc/systemd/resolved.conf`:

```ini
DNS=9.9.9.9#dns.quad9.net 1.1.1.1#cloudflare-dns.com
DNSOverTLS=yes
DNSSEC=allow-downgrade
```

> ⚠️ **Cambio con dientes**: mal aplicado deja el VPS sin DNS y la API pierde Supabase.
> Hacerlo con la consola web del proveedor abierta como plan B y verificar con
> `resolvectl query github.com` antes de darlo por bueno.

## 8. Troubleshooting

### A) "El stack no volvió tras el reinicio"

```bash
systemctl status docker --no-pager
systemctl is-enabled docker              # si dice "disabled": sudo systemctl enable --now docker
cd ~/baraja && docker compose up -d
```

### B) "APT roto / sin espacio al instalar un kernel"

```bash
df -h /
sudo apt autoremove --purge
sudo apt --fix-broken install
sudo journalctl --vacuum-time=7d
docker system prune -af                  # libera mucho; borra imágenes no usadas
```

### C) "La máquina se reinició sola sin que nadie lo pidiera"

```bash
journalctl --list-boots | tail -5                      # ¿cuándo fue el corte?
journalctl -b -1 -e --no-pager | tail -50              # final del arranque previo
journalctl -b -1 --no-pager | grep -iE 'oom|out of memory|panic'
uptime                                                  # ¿coincide con el corte?
```

Con 2 GB de RAM, la causa más probable es el **OOM killer** (la API, Prometheus y Grafana suman
~300–450 MB; una consulta pesada en Grafana puede disparar el pico). Si no hay rastro de OOM ni
de panic en el arranque anterior, el corte vino de fuera: mantenimiento o incidencia del
hipervisor — consultar el panel de clouding.io.

> En esta máquina el `watchdog` está **deshabilitado** y no hay `/dev/watchdog` (§1). Si se
> reactivara, sería el primer sospechoso: `max-load-1` o `min-memory` mal dimensionados en
> `/etc/watchdog.conf` reinician un VPS pequeño bajo carga legítima.
> Comprobar con `systemctl is-enabled watchdog`.

### D) "`canonical-livepatch status` da error o `unapplied`"

```bash
sudo canonical-livepatch status --verbose
sudo pro status
uname -r                                  # ¿kernel soportado por Livepatch?
sudo canonical-livepatch refresh
```

Causa habitual: kernel en ejecución fuera de la lista soportada. Reiniciar al kernel más
reciente instalado suele resolverlo.

### E) "needrestart me corta la sesión SSH o se cuelga en el diálogo"

En instalaciones interactivas, needrestart pregunta qué servicios reiniciar. Modos no
interactivos (útil en scripts):

```bash
sudo NEEDRESTART_MODE=l apt upgrade      # (l)ist: informa, no reinicia nada
sudo NEEDRESTART_MODE=a apt upgrade      # (a)utomatic: reinicia lo que pueda sin preguntar
```

`dbus` y `systemd-logind` se difieren siempre, en cualquier modo: es la protección que evita
dejar la sesión en estado zombi.
