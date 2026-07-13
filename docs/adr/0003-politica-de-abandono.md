# ADR-0003: Política de abandono

- **Estado**: Aceptada
- **Fecha**: 2026-07-13

## Contexto

Las reglas del Solitario Orda definen la derrota como toda partida que termina sin victoria, incluida la desconexión (cierre de pestaña, pérdida de red, cambio de página). HTTP no notifica desconexiones: el servidor no recibe ningún evento cuando un jugador desaparece, así que el abandono implícito debe **inferirse**. La política afecta además al cronómetro (lo mide el servidor y el tiempo total es el desempate del ranking).

## Opciones consideradas

### Heartbeat del cliente (ping periódico)

- ✅ Detección rápida, en segundos.
- ❌ Tráfico constante por jugador que choca con el rate limiting, y una red inestable produce falsos abandonos. Es el patrón natural del tiempo real: encajará con los WebSockets de la fase multijugador.

### Barrido programado (cron o job periódico)

- ✅Estado siempre consistente sin esperar a que alguien toque la partida.
- ❌ Pieza nueva que operar, y por sí sola no resuelve el caso del jugador que vuelve justo antes del barrido.

### Expiración perezosa sobre `lastMoveAt` (elegida)

- ✅Sin procesos nuevos: la expiración se evalúa cuando algo toca la partida. Es el mismo modelo con el que Django trata sus sesiones expiradas.
- ❌ Deja partidas "zombi" sin consolidar hasta que algo las toca.

## Decisión

- `Match.lastMoveAt` se actualiza con cada movimiento. **TTL de inactividad: 30 minutos** - holgado para pensar cualquier jugada de un solitario, corto para no acumular partidas muertas. Configurable por env (`MATCH_INACTIVITY_TTL_MS`).

- **Expiración perezosa**: cualquier acceso que toque una partida (lectura, movimiento, consolidación del ranking) cuyo `lastMoveAt` supere el TTL la marca abandonada en ese momento. Un jugador que reaparece recibe el estado final (derrota), nunca una partida jugable.

- El **tiempo contabilizado** de una derrota por TTL es `lastMoveAt - startedAt`: los minutos de ausencia no se acumulan al perfil.

- La expiración perezosa se complementará con un barrido periódico (el equivalente al `clearsessions` de Django); su mecanismo concreto se decide en el issue del gestor de partidas (F5-6).

## Consecuencias

- Hasta que exista el barrido, la métrica de "partidas activas" puede sobrecontar zombis. Se asume y se corrige en F5-6/F5-11.

- Esta política cubre solo juegos por turnos sobre HTTP; en la fase multijugador la detección pasará a presencia por WebSocket y requerirá su propio ADR.
