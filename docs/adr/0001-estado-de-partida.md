# ADR-0001: Almacenamiento del estado de partida

- **Estado**: Aceptada
- **Fecha**: 2026-07-13

## Contexto

Hasta la v1.2.0 la API es completamente stateless: cada petición se resuelve sin memoria de las anteriores. La Fase 5 introduce partidas, cuyo estado (pilas, carta en mano, ronda, estrellas, cronómetro) debe sobrevivir entre peticiones y cuya única fuente de verdad es el servidor (server-authoritative).

Condicionantes de la decisión:

- **Durabilidad entre despliegues**: el CD despliega a producción en cada merge a `main`, varias veces por semana. Una partida en curso no puede depender de la vida del proceso.
- **Concurrencia**: dos peticiones simultáneas sobre la misma partida (doble click, doble pestaña) no deben corromper el estado.
- **Infraestructura**: VPS de 1 vCore / 2 GB donde ya residen Nginx, la API, Prometheus y Grafana; cada servicio nuevo compite por esa RAM.
- **Escala real**: un solitario genera ~1 escritura por movimiento por jugador. Decenas de jugadores simultáneos son unas pocas escrituras por segundo.

## Opciones consideradas

### Memoria del proceso

- ✅ La más simple y la más rápida (sin I/O).
- ❌ Cada deploy o reinicio del contenedor destruye todas las partidas en curso.
- ❌ No escala a más de un proceso o réplica.

### Redis

- ✅ Estándar en gaming a gran escala: estado efímero con TTL nativo y latencia mínima.
- ❌ Servicio nuevo que operar (memoria, versión, backups) en un VPS ajustado.
- ❌ Sin persistencia configurada (RDB/AOF) comparte el problema de durabilidad de la memoria; configurarla acerca su complejidad operativa a la de una base de datos.
- ❌ Optimiza un problema de rendimiento que este proyecto no tiene.

### PostgreSQL + Prisma (elegida)

- ✅ Durable por defecto, con backups ya resueltos (Supabase).
- ✅ Cero infraestructura nueva; stack ya integrado y conocido por el equipo.
- ✅ Transacciones para consolidar la partida -> perfil (estrellas, tiempo, logros).
- ❌ Más latencia que memoria o Redis (irrelevante a la escala actual).

## Decisión

El estado vive en PostgreSQL como **snapshot completo** en una columna `Json` del modelo `Match`, acompañado de una columna `version Int` para **bloqueo optimista**: cada UPDATE incluye `WHERE version = "<versión leída>"` e incrementa la versión; si no afecta a ninguna fila, otra petición se adelantó y la API responde 409. Es la alternativa barata al `select_for_update()` de Django: mismo objetivo, sin retener bloqueos en la BD.

## Consecuencias

- El JSON no se consulta por dentro con SQL: el estado se carga y se guarda siempre entero. Los campos que el negocio necesita consultar (status, estrellas, movimientos, fechas) se **duplican como columnas** de `Match`.

- El `GameState` incluye un campo `schemaVersion`: si la forma del estado cambia con partidas vivas, se detecta el snapshot antiguo y la partida se invalida de forma controlada (cancelada, sin computar como derrota). Aceptado para el MVP.

- El cliente debe manejar el 409: recargar la vista de la partida y reintentar.

## Seguimiento (F5-6)

La invalidación por `schemaVersion` se implementó de la forma **más simple posible** y no
como se anticipa arriba: `readState` (`services/matchService.ts`) lanza un `Error` genérico
cuando la versión no es la esperada, que el `errorHandler` convierte en **500** y reporta a
Sentry. No existe un estado "cancelada" en el enum `MatchStatus`, ni se distingue de un
fallo real del servidor.

Es aceptable mientras `schemaVersion` sea 1 y no haya habido ninguna migración de formato
—hoy la rama es inalcanzable—, pero deja de serlo en cuanto se cambie la forma del estado
con partidas vivas: entonces habrá que decidir el estado terminal y devolver un 4xx
explicativo en lugar de un 500 que ensucia el error tracking.
