# ADR-0002: Autenticación e identidad

- **Estado**: Aceptada
- **Fecha**: 2026-07-13

## Contexto

La plataforma introduce perfiles de jugador (estrellas, logros, tiempo de juego) y un ranking público. Requisito de producto: **cero datos personales** - nickname anónimo, contraseña y avatar - para minimizar la superficie legal (RGPD). La API es stateless y la consume un SPA servido desde otro subdominio (cross-origin).

## Opciones consideradas

### Sesiones en servidor (cookie + tabla)

- ✅ Revocación inmediata (borrar la fila de sesión).
- ✅ Cookie httpOnly: el token no es accesible desde JavaScript.
- ❌ Introduce estado y una tabla más; complica el cross-origin (SameSite, CORS con credenciales).

### JWT stateless (elegida)

- ✅ Coherente con la API stateless: sin tabla ni estado de sesión en el servidor.
- ✅ Patrón estándar para SPA + API (equivalente a DRF SimpleJWT o FastAPI OAuth2)
- ❌ No revocable antes de expirar; el logout es solo borrar el token en el cliente.

### Política de contraseña propia: "color + palabra" (descartada)

Se consideró un esquema propio: color elegido en el formulario (valor hexadecimal) + palabra de mínimo 8 caracteres. Se descarta por tres razones:

- La entropía real del color es muy baja: los usuarios eligen colores predecibles (~media docena de valores frecuentes).
- Rompe los gestores de contraseñas, la herramienta que más seguridad real aporta.
- Los esquemas de autenticación sin estándar ni auditoría son una mala práctica: en seguridad se usa lo probado. Referencia: NIST SP 800-63B - la longitud aporta más que cualquier regla de composición.

## Decisión

- **Token**: JWT firmado con HS256 (`JWT_SECRET`, mínimo 32 bytes aleatorios), claims mínimos (`sub` = id de usuario, `iat`, `exp`), expiración de 7 días (`JWT_EXPIRES_IN`), transportado como `Authorization: Bearer`. Sin refresh token en el MVP.

- **Hashing**: argon2id (ganador de la Password Hashing Competition) con los parámetros por defecto de la librería.

- **Contraseña**: mínimo 10 caracteres, máximo 128, sin reglas de composición; se fomenta la passphrase. Post-MVP: blocklist de contraseñas comunes.

- **Nickname**: 3-20 caracteres `[a-zA-Z0-9_]`, único de forma **case-insensitive** (se normaliza a minúsculas para la unicidad; se muestra tal como se escribió).

## Consecuencias

- Un token robado es válido hasta su expiración y el logout es solo de cliente: aceptado para una plataforma sin datos sensibles.

- **Sin email no existe recuperación de contraseña**: perderla implica perder la cuenta. Se acepta para el MVP y se avisará en el registro. Mitigación post-MVP: códigos de recuperación de un solo uso generados en el alta.

- Nuevas variables de entorno validadas en `config/env.ts`: `JWT_SECRET`, `JWT_EXPIRES_IN`.

- `/auth/*` requiere un rate limiting más estricto que el general (fuerza bruta); se implementa en F5-3.

- El 409 de registro confirma nicknames existentes: aceptado, los nicknames son públicos en el ranking por diseño.
