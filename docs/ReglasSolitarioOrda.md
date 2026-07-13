# SOLITARIO ORDA

Este juego de cartas es una variante del clásico solitario, donde un jugador con una baraja desordenada tiene el objetivo de ordenar las cartas en sus cuatro palos en orden ascendente: desde el As (1) hasta el Rey (12).

## Requisitos

- 1 jugador
- 1 baraja española completa (48 cartas + 2 comodines = 50 cartas)

## Conceptos

**Valores**: As (1), 2–7, 8, 9, sota (10), caballo (11) y rey (12). El orden ascendente es continuo del 1 al 12, sin saltos.

**Escalera**: secuencia de cartas apiladas en orden descendente consecutivo donde cada carta es de palo distinto a la carta inmediatamente inferior. Ejemplo: sota de oros → 9 de copas → 8 de oros → 7 de bastos.

**Carta en mano**: cuando el jugador roba de la pila de robo (o recupera una carta del descarte con un comodín), esa carta pasa a su mano y **debe colocarla antes de realizar cualquier otra acción**. Con una carta en mano no se pueden usar estrellas ni mover otras cartas; sí se pueden consultar los montones desplegables.

**Montones y visibilidad**:

| Montón              | Cartas                    | ¿Desplegable al hacer click?               |
| ------------------- | ------------------------- | ------------------------------------------ |
| Cruz (5 posiciones) | Boca arriba               | Sí: se muestran todas las cartas ordenadas |
| Esquinas (4 palos)  | Boca arriba               | No: solo se ve la carta superior           |
| Pila de robo        | Boca abajo                | No                                         |
| Pila de descarte    | Boca arriba               | Sí: se muestran todas las cartas ordenadas |
| Espacio extra       | 1 sola carta, boca arriba | —                                          |

En todos los montones, la carta superior bloquea al resto: solo la carta superior es jugable (única excepción: el movimiento en bloque del logro _Escalera mecánica_). Los montones desplegables pueden consultarse en cualquier momento, incluso con una carta en mano (en ese caso solo para mirar, sin seleccionar).

## Disposición inicial

Se toman 5 cartas y se colocan boca abajo en una matriz de 3x3 con las esquinas inicialmente vacías (aquí se formarán los palos):

| **Oros**    | Carta 1 | **Copas**  |
| ----------- | ------- | ---------- |
| Carta 2     | Carta 3 | Carta 4    |
| **Espadas** | Carta 5 | **Bastos** |

En la matriz existen las cartas de la cruz (las 5 posiciones centrales) y las esquinas de los palos.

Además de la matriz, existen 2 espacios adicionales:

- **Pila de robo**: las 45 cartas restantes, barajadas y boca abajo.
- **Pila de descarte**: inicialmente vacía; las cartas descartadas se amontonan boca arriba.

Con el espacio dispuesto, se muestra una cuenta atrás (3, 2, 1…), se voltean las 5 cartas de la cruz, el servidor comienza a contar el tiempo y empieza el juego.

**Comodín inicial**: si entre las 5 cartas iniciales aparece un comodín, al voltearlo se convierte inmediatamente en estrella y su posición queda como hueco vacío en la cruz.

## Movimientos legales

Cada movimiento desplaza **una sola carta**, siempre la superior de su montón (única excepción: el movimiento en bloque del logro _Escalera mecánica_).

Destinos posibles de una carta:

1. **Cruz, sobre otra carta**: la carta de destino debe tener el valor inmediatamente superior y un palo distinto.
   - El 4 de copas se puede colocar sobre el 5 de bastos.
   - El 9 de espadas se puede colocar sobre la sota (10) de oros.
   - El 4 de copas NO se puede colocar sobre el 5 de copas, ni el 9 de espadas sobre la sota de espadas.
2. **Cruz, hueco vacío**: un hueco admite **cualquier carta**, venga de donde venga (mano, descarte, otra pila de la cruz, esquinas o espacio extra). Rellenar un hueco nunca es obligatorio.
3. **Esquinas**: cada esquina acumula su palo en orden ascendente estricto, empezando por el As.
   - Si en la esquina de oros está el As de oros, se puede colocar el 2 de oros.
   - Si en la esquina de espadas está la sota, se puede colocar el caballo (11) de espadas.
   - Si la carta superior de la esquina de bastos es el 4, NO se puede colocar el 6 de bastos: falta el 5.
   - No se puede colocar una carta de palo distinto al de la esquina.
4. **Espacio extra** (solo si está desbloqueado con un comodín): admite cualquier carta, pero **solo una**; no se acumulan. La carta puede retirarse en cualquier momento hacia un destino legal, y el espacio queda libre para alojar otra.
5. **Pila de descarte**: el descarte es **siempre voluntario** — una carta puede descartarse aunque tenga colocación legal. Solo es **obligatorio** cuando la carta en mano no admite ninguna colocación legal (ni cruz, ni hueco, ni esquina, ni espacio extra).

Movimientos entre montones: la carta superior de cualquier montón (cruz, descarte, esquinas, espacio extra) puede moverse a cualquier destino legal de la lista anterior. En particular:

- **Cruz → cruz** está siempre permitido (si el destino es legal).
- **Las esquinas se pueden desmontar**: la carta superior de una esquina puede volver a la cruz o ir al descarte. Es una mecánica válida y no penaliza la puntuación.

## Rondas

Se denomina ronda a cada ciclo de movimientos entre el robo de una carta y el siguiente. Con 50 cartas y 5 en la matriz inicial, una partida completa tiene **45 rondas** de robo más la ronda inicial.

- **Ronda 0**: se voltean las 5 cartas de la cruz y el jugador realiza todos los movimientos legales que desee (colocar en esquinas si salió un As, apilar en la cruz, descartar…).
- **Rondas 1 a 45**: el jugador roba una carta (pasa a su mano) y debe colocarla en un destino legal o en el descarte. Después puede encadenar todos los movimientos legales que considere. Cuando roba de nuevo, empieza la ronda siguiente.
- Robar un **comodín** también consume su ronda: el comodín se convierte en estrella al instante (no hay carta que colocar) y el jugador continúa la ronda con movimientos libres.
- Tras el último robo (ronda 45), el jugador sigue moviendo cartas hasta que gana o abandona.

## Condición de victoria / derrota

- **Victoria**: las cuatro esquinas están completas, con los cuatro Reyes como carta superior y los cuatro palos ordenados (las 48 cartas colocadas). Solo puede ocurrir tras el último robo.
- **Derrota**: toda partida que termina sin victoria. El botón **ABANDONAR** está siempre visible durante la partida; en la ronda 45, al robar la última carta, se muestra destacado para que el jugador abandone si considera que no puede completar el juego con movimientos legales. También cuenta como abandono que la sesión de partida finalice sin victoria por cualquier otra vía: pérdida de conexión, cierre de la pestaña o cambio de página.

La partida nunca se bloquea antes de la ronda 45: la carta en mano siempre puede ir al descarte.

## Comodines y estrellas

Cuando aparece un comodín (robado o volteado en la disposición inicial), se convierte automáticamente en una **estrella** visible para el jugador. Hay 2 comodines, por tanto un máximo de 2 estrellas por partida.

**Cuándo se usan**: en cualquier momento en que el jugador **no tenga una carta en mano** — antes de robar o al terminar un movimiento —, incluida toda la fase final de la ronda 45.

**Usos** (cada estrella elige uno):

1. **Desbloquear el espacio extra**, junto a la pila de descarte (ver movimientos legales).
2. **Obtener cualquier carta de la pila de descarte** (no solo la superior: la pila es desplegable). La carta elegida desaparece del descarte, pasa a la mano del jugador y debe moverse inmediatamente a un destino legal. Si el jugador elige una carta sin colocación posible (mala jugada), estará obligado a jugarla al único destino permitido: el descarte, donde quedará como **carta superior visible** (no regresa a su posición original dentro de la pila).

Ambos usos son combinables libremente: dos espacios extra, dos recuperaciones, o uno de cada. Las estrellas no usadas no se pierden: la tabla de puntuación premia terminar la partida sin gastarlas.

## Logro: Escalera mecánica

El único movimiento que permite desplazar más de una carta, y hay que descubrirlo jugando.

**La maniobra**: en una pila de la cruz hay una sota de oros. En otra pila hay un 7 de bastos y, debajo, el 8 de oros y el 9 de copas. El jugador puede: descartar el 7 de bastos, descartar el 8 de oros, mover el 9 de copas sobre la sota de oros, recuperar del descarte el 8 de oros sobre el 9 de copas y, por último, el 7 de bastos sobre el 8 de oros. Ha desmontado una escalera en el descarte y la ha remontado sobre otra pila de la cruz.

**Cómo se consigue**: la primera vez que el jugador ejecuta esta maniobra con una escalera de **al menos 4 cartas** — contando todas las cartas remontadas, incluida la que se mueve directa de cruz a cruz —, con movimientos **consecutivos** y **dentro de la misma ronda**, desbloquea el logro _Escalera mecánica_. El ejemplo anterior mueve una escalera de solo 3 cartas (9, 8 y 7), por lo que **no** desbloquea el logro; si sobre el 7 de bastos hubiera además un 6 de espadas y la maniobra remontara las 4 cartas (9 + 8 + 7 + 6), sí lo haría. Solo cuenta la vía cruz → descarte → otra pila de la cruz (el espacio extra solo admite una carta, por lo que no participa en la maniobra).

**El beneficio**: el logro pertenece al **perfil del jugador**: vale para la partida en curso y todas las futuras. Con el logro activo, al desplegar una pila de la cruz el jugador puede seleccionar una carta interior y mover en bloque esa carta y todas las que tiene encima. El movimiento en bloque:

- Solo admite destinos de la cruz (una carta que haga legal la colocación de la carta seleccionada, o un hueco vacío). Nunca al descarte ni a las esquinas.
- Puede partir la escalera por cualquier carta: si bajo el 9 de copas del ejemplo hubiera una sota de espadas, mover en bloque 9 + 8 + 7 sobre la sota de oros seguiría siendo legal.
- El mínimo de 4 cartas solo aplica al **desbloqueo** del logro: una vez conseguido, el movimiento en bloque admite escaleras de cualquier tamaño (2, 3, 4… cartas).
- Es azúcar de UX: equivale exactamente a la maniobra manual, que sigue estando permitida.

## Puntuación

La puntuación de la partida se mide en estrellas según esta tabla, que es la **puntuación final** (máximo 5):

| Estrellas | Juego    | Comodines usados | Tiempo   |
| --------- | -------- | ---------------- | -------- |
| 0         | Derrota  | —                | —        |
| 1         | Victoria | 2                | —        |
| 2         | Victoria | 1                | ≥ 10 min |
| 3         | Victoria | 1                | < 10 min |
| 4         | Victoria | 0                | ≥ 5 min  |
| 5         | Victoria | 0                | < 5 min  |

Las estrellas de comodín son un recurso de la partida, no puntos directos: la tabla ya premia ganar sin gastarlas. Las estrellas obtenidas se acumulan en el perfil del jugador para el ranking.

**Ranking**: se ordena por estrellas acumuladas y, en caso de empate, por menos tiempo de juego total — el primero es quien ha conseguido más estrellas en menos tiempo. El número de movimientos por partida se registra como métrica interna, pero no afecta al ranking.

**Tiempo**: el cronómetro lo mide el **servidor** (a prueba de trampas). Arranca al terminar la cuenta atrás inicial y corre sin pausas hasta la victoria o el abandono. La duración de cada partida se acumula además en el tiempo de juego total del perfil.

## Perfil del jugador

La plataforma requiere identificación de usuario (Fase 5), sin datos personales para evitar complejidad legal de protección de datos:

- Registro y login seguros con **nickname anónimo**, contraseña y avatar.
- El perfil acumula: estrellas (ranking), logros y tiempo de juego total.

**Alcance del MVP**: el único logro implementado inicialmente es _Escalera mecánica_. El resto de logros coleccionables del metajuego (p. ej. el logro "irónico" por la mala jugada del comodín) quedan para una fase post-MVP.
