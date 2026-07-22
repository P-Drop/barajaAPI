# Design doc - Motor del Solitario Orda

> Documento vivo. Describe la forma del sistema decidida en F5-1: las alternativas y sus argumentos viven en los ADRs 0001-0003; las reglas canónicas del juego, en [ReglasSolitarioOrda.md](../ReglasSolitarioOrda.md).

## Ubicación y principios

El motor es un módulo **puro** en `apps/api/src/games/orda/`: sin HTTP, sin Prisma y sin reloj propio (el tiempo no interviene en el núcleo). Los services lo importan - es la capa de dominio de Clean Architecture, por debajo de services. Su contrato central es un reducer:

```ts
applyMove(state: GameState, move: Move): MoveResult
```

> _Nota (F5-4)_: se eliminó el parámetro `now: Date` que esbozaba este documento. Ninguna regla del núcleo depende del tiempo, así que el motor no recibe reloj: el cronómetro (`startedAt`/`lastMoveAt`/`finishedAt`) vive en el `Match` y la capa de servicio (F5-6), no en el dominio puro.

- **Server-authoritative**: el cliente propone movimientos; solo el motor decide su legalidad.

- **Determinista y serializable**: `GameState` es un objeto plano (sin clases ni funciones), persistible tal cual como JSON (ADR-0001) y testeable sin infraestructura.

## Tipos centrales

### GameState (snapshot serializable)

- `schemaVersion`: detección de snapshots de forma antigua (ADR-0001).
- Pilas: `cross[5]` (posición vacía = hueco), `corners` (una por palo), `stock`, `discard`, `extra` (0-2 slots desbloquados con estrellas; cada uno `null` = vacío o una carta).
- `hand`: carta en mano, o `null`.
- `round`: 0 - 45.
- Estrellas: `starsAvailable` y `starsUsed` (la tabla de puntuación necesita ambas).
- Logro: `stairwayUnlocked` (bool, habilita el movimiento en bloque en esta partida) y `stairwayBuilding` ( `{ pile, count } | null`, prograso de la maniobra en curso).
- `moveCount` y `status` (`IN_PROGRESS | WON | LOST`).

### Achievements

El logro pertenece al perfil: `createGame(rng, achievements: Achievements)` siembra `stairwayUnlocked`; si se desbloquea durante la partida, el servicio lo persiste al perfil (F5-7).

### Move (unión discriminada)

| **Tipo**              | **Payload**                       | **Regla que implementa**                       |
| --------------------- | --------------------------------- | ---------------------------------------------- |
| `DRAW`                | -                                 | Robar de la pila (inicia la ronda siguiente)   |
| `PLACE`               | `from`, `to`                      | Colocar la carta superior de un montón en otro |
| `MOVE_STACK`          | `fromPile`, `cardIndex`, `toPile` | Movimiento en bloque (requiere el logro)       |
| `USE_STAR_EXTRA_SLOT` | -                                 | Desbloquear el espacio extra                   |
| `USE_STAR_RECOVER`    | `cardId`                          | Recuperar una carta del descarte -> mano       |
| `ABANDON`             | -                                 | Abandono (botón siempre visible)               |

`from`/`to` referencian **posiciones** (`cross:2`, `corner:OROS`, `discard`, `extra:0`), nunca cartas: la carta movida es siempre la superior del montón de origen, salvo dos casos: - `MOVE_STACK` mueve una carta interior de la cruz junto con las de encima. - `USE_STAR_RECOVER` toma una carta **elegida por `cardId`** de cualquier posición del descarte.

### MoveResult

Éxito con el `GameState` nuevo, o error de dominio tipado con el motivo de la ilegalidad. El service lo traduce a `DomainError` -> 400 con mensaje en español, igual que el resto de la API.

### Puntuación (`scoring.ts`)

`computeStars(won, starsUsed, elapsedSeconds)`, función pura; el tiempo se **inyecta** (el motor no tiene reloj) y la llama el servicio al finalizar la partida (**F5-6**).

### Match (Prisma)

`id, userId, state Json, version, status, result, stars, moveCount, startedAt, lastMoveAt, finishedAt`
Los campos consultables (status, estrellas, fechas...) se duplican fuera del JSON a propósito: el snapshot no se consulta por dentro con SQL (ADR-0001).

## Vista del jugador ≠ estado interno

El `GameState` contiene información oculta: el orden de la pila de robo. La API **nunca lo devuelve entero:** serializa una proyección (`PlayerView`) donde `stock` es solo `{ count }`. Con las DevTools abiertas no hay nada que espiar, porque las cartas no reveladas no viajan. En la fase multijugador este mismo mecanismo dará a cada jugador una vista con solo su mano.

## Contrato REST

| **Método** | **Ruta**                    | **Auth** | **Descripción**                                  |
| ---------- | --------------------------- | -------- | ------------------------------------------------ |
| POST       | `/api/v1/auth/register`     | -        | Alta de usuario                                  |
| POST       | `/api/v1/auth/login`        | -        | Devuelve el JWT                                  |
| POST       | `/api/v1/matches`           | ✔        | Crea partida (el servidor baraja)                |
| GET        | `/api/v1/matches/:id`       | ✔dueño   | `PlayerView` de la partida                       |
| POST       | `/api/v1/matches/:id/moves` | ✔dueño   | Aplica un `Move`, devuelve la `PlayerView` nueva |
| GET        | `/api/v1/profile`           | ✔        | Perfil propio (estrellas, logros, tiempo total)  |
| GET        | `/api/v1/ranking`           | -        | Estrellas desc, desempate por tiempo asc.        |

**Decisiones de contrato**:

- Cada movimiento responde con la `PlayerView` completa actualizada: cliente tonto, el servidor manda, nada que reconciliar.
- El abandono es un `Move` más (`ABANDON`), no un endpoint.
- Conflicto de bloqueo optimista -> **409**; el cliente recarga la vista y reintenta.
- Acceso a una partida ajena -> **404** (no se revela que el id existe)
- No hay "retomar partida": si el TTL venció, cualquier acceso devuelve la partida ya consolidada como derrota (ADR-0003).
- `GET /api/v1/ranking` pagina con `limit` / `offset` y expone nickname, avatar, estrellas y tiempo total.
