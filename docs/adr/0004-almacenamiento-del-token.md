# ADR-0004: Almacenamiento del token en el cliente

- **Estado**: Aceptada
- **Fecha**: 2026-07-22

## Contexto

El backend autentica con JWT vía header `Authorization: Bearer` (ADR-0002). El frontend (SPA React) necesita conservar ese token entre navegaciones para mantener la sesión y adjuntarlo a las peticiones protegidas. Como la autenticación es por header (no por cookie), el token **debe ser accesible desde JavaScript**, lo que expone superficie de XSS. Hay que elegir dónde guardarlo equilibrando UX y ventana de exposición.

## Opciones consideradas

### `localStorage`

- ✅ Persiste entre recargas y cierres de pestaña; API simple.
- ❌ Legible por cualquier script (XSS) durante toda la vida del token, y persiste indefinidamente hasta un `logout` explícito: la ventana de robo es máxima.

### En memoria (state de React)

- ✅ Nunca se persiste; la superficie de robo se limita a la ejecución actual.
- ❌ Se pierde en cada recarga (F5) → el usuario reinicia sesión constantemente. UX inaceptable sin un mecanismo de refresh, que el backend actual no tiene.

### `sessionStorage` (elegida)

- ✅ Sobrevive a la recarga (buena UX) pero se borra al cerrar la pestaña, **acotando la ventana de exposición** frente a `localStorage`. API idéntica.
- ❌ Sigue siendo legible por JS (XSS); no se comparte entre pestañas (el usuario inicia sesión por pestaña).

### Cookie `httpOnly` (descartada por alcance)

- ✅ Inaccesible desde JS: inmune al robo por XSS.
- ❌ Exigiría refactorizar el backend de auth por header a auth por cookie (`Set-Cookie`, CSRF, CORS con credenciales). Fuera del alcance de F5-8; queda como evolución futura.

## Decisión

El token se guarda en **`sessionStorage`**, accedido **solo a través de la capa de sesión** (`AuthContext`/`useAuth`), nunca disperso por los componentes. Al cerrar la pestaña la sesión termina; el `logout` lo borra explícitamente.

Mitigaciones de XSS asumidas: React escapa el contenido por defecto, no se usa `dangerouslySetInnerHTML`, y las dependencias se vigilan con Dependabot.

## Consecuencias

- **Ítem de auditoría de la fase de pentest** (Fase 7 tras la renumeración del ROADMAP; era la 6 cuando se escribió este ADR): un XSS podría exfiltrar el token de `sessionStorage`. La mitigación definitiva (cookie `httpOnly` + refresh token) se evalúa entonces, asumiendo el coste de refactor.
- La sesión **no se comparte entre pestañas**: abrir una pestaña nueva exige re-login. Contrapartida asumida a cambio de acotar la exposición.
- El token vive hasta su expiración (≤7 días, ADR-0002), hasta cerrar la pestaña, o hasta `logout`, lo que ocurra antes.
