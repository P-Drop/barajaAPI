# Caché HTTP de los estáticos del front — concepto y operación

> Política aplicada en el server block de `baraja.pedrorincon.dev` (copia
> versionada en `deploy/nginx/baraja.pedrorincon.dev.conf`).

## El concepto en una frase

Sin `Cache-Control`, el navegador guarda los archivos pero **revalida en cada
visita** (una petición condicional por archivo → `304 Not Modified`): ahorra
descarga, no viajes. Con `Cache-Control: max-age=...`, el navegador usa su copia
local **sin preguntar** durante ese plazo: cero peticiones. El precio: si el
archivo cambia en el servidor bajo el mismo nombre, el cliente no lo ve hasta
que su copia expire. Toda la política consiste en gestionar ese trade-off
**por tipo de archivo**.

## La política de tres niveles

| Tipo                    | Ejemplo                               | ¿Cambia bajo el mismo nombre?                      | Política                                                                             |
| ----------------------- | ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Punto de entrada        | `/index.html`                         | **En cada deploy** (referencia los bundles nuevos) | `no-cache` = guardar pero **revalidar siempre** (304 barato; HTML nuevo tras deploy) |
| Bundles Vite (con hash) | `/assets/index-DfKp6xNp.js`           | **Nunca** (el hash del contenido va en el nombre)  | `1y` + `immutable` (ni siquiera revalida al recargar)                                |
| Assets sin hash         | `/cards/oros_1.webp`, `/textures/...` | Podría (reemplazo manual del arte)                 | `30d` (compromiso)                                                                   |

La lógica del sistema: `index.html` siempre fresco → apunta a bundles con
nombre nuevo en cada build → el caché "eterno" de `/assets/` nunca sirve código
viejo. Es el patrón estándar de las SPA (y la razón de que Vite hashee los
nombres).

## Consideraciones en producción

- **Cambiar un asset sin hash** (p. ej. sustituir una carta): los navegadores
  pueden servir el viejo hasta 30 días. Si necesitas que se vea ya, cambia el
  **nombre** del archivo (y su referencia) — es un cache-bust manual. No confíes
  en "borrar el caché" de los usuarios.
- **Verificación tras tocar la config** (desde fuera del VPS):
  ```bash
  curl -sI https://baraja.pedrorincon.dev/index.html | grep -i cache-control       # no-cache
  curl -sI https://baraja.pedrorincon.dev/cards/oros_1.webp | grep -i cache-control # public, max-age=2592000
  # bundle real: sacarlo del HTML y comprobar "public, immutable"
  ```
  En DevTools → Network, la segunda recarga debe mostrar _(disk cache)_ /
  _(memory cache)_ en cartas y bundles.
- **Al depurar, desactiva tu propio caché** (DevTools → Network → _Disable
  cache_): si no, perseguirás fantasmas que solo existen en tu navegador.
- **Los `location` de caché viven en el block 443**; recuerda la prioridad de
  Nginx: `=` exacto → `^~` prefijo → regex `~*` → prefijo normal (`location /`).
  El fallback SPA (`try_files ... /index.html`) re-evalúa los `location`, por lo
  que también recibe el `no-cache` del bloque exacto.
- **Mantén sincronizada la copia versionada** (`deploy/nginx/*.conf`) tras
  cualquier edición en el VPS (Certbot también reescribe ese archivo al cambiar
  config de TLS).
- **Cloudflare**: con la nube gris (DNS-only, la actual) no hay caché de borde:
  estas cabeceras solo gobiernan navegadores. Si algún día se activa el proxy
  (nube naranja), Cloudflare **respetará y amplificará** esta política en su CDN
  — revisar entonces las reglas de caché del panel.
