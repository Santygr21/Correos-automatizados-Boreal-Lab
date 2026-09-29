# Correos automáticos

Herramienta minimalista para enviar correos personalizados a una lista de contactos usando React (Vite) + Node + Nodemailer.

## Estructura

```
package.json        Scripts raíz (pnpm dev levanta api + web a la vez)
pnpm-workspace.yaml  Declara client y server como paquetes del workspace
server/              API Express + Nodemailer (puerto 3001)
client/              UI React con Vite (puerto 5173, proxy a /api)
```

## Requisitos

- Node.js 18+
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- Una cuenta Gmail con **contraseña de aplicación** (activa 2FA primero en tu cuenta de Google → Seguridad → Contraseñas de aplicaciones)

## Uso

1. Instalar dependencias (una vez, **desde la raíz del proyecto**):

```bash
pnpm install
```

Esto instala la API, la UI y el script `pnpm dev` de una sola vez. Si después hacés
`git pull` y el pull trae dependencias nuevas, volvé a correr `pnpm install` en la raíz.

2. Levantar todo con un solo comando:

```bash
pnpm dev
```

Esto arranca la API (`:3001`) y la UI (`:5173`) en la misma terminal, con las salidas etiquetadas como `[api]` y `[web]`. Un `Ctrl+C` las detiene las dos.

3. Abrir http://localhost:5173

4. En la app:
   - **SMTP**: host `smtp.gmail.com`, puerto `465`, tu correo y la contraseña de aplicación
   - **Mensaje**: asunto + cuerpo. Usa `{{name}}` para personalizar por contacto y `{{motivo}}` (opcional) para mencionar algo específico de cada persona
   - **CSV**: sube un archivo con columnas `name` y `email` (sin encabezado o con encabezado). Si tu archivo tiene una columna `motivo` (o `tema`/`contexto`), se usa para `{{motivo}}`; es opcional y no afecta al envío cuando falta
   - **Vista previa** → confirma y envía

## Notas

- Envío limitado a ~7 segundos entre correos para evitar bloqueos de Gmail
- Las credenciales solo viven en memoria durante el envío; no se guardan en disco
- El progreso se muestra en vivo vía SSE
- `pnpm dev` usa `--kill-others-on-fail`: si la API no arranca (por ejemplo, porque el puerto 3001 ya está ocupado), la UI se apaga sola en vez de quedarse colgada
- Para correr solo una parte: `pnpm -C server start` o `pnpm -C client dev`

## Problemas frecuentes

### `[vite] http proxy error: /api/test — Error: connect ECONNREFUSED ::1:3001`

La API **no está corriendo**. No es un problema de Gmail ni de la contraseña de aplicación:
el proxy de Vite no encontró nada escuchando en el puerto 3001, así que la petición ni
siquiera llegó al servidor.

Revisá, en este orden:

1. **Que `pnpm install` se haya corrido desde la raíz del proyecto.** Si solo instalaste
   una vez y después trajiste cambios con `git pull`, la API puede haber muerto al
   arrancar. Corré `pnpm install` de nuevo y fijate que la línea `[api]` aparezca en la
   terminal. Si ves `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'`, es eso.
2. **Si el error aparece al arrancar:** `El puerto 3001 ya está en uso`. Liberalo con
   `lsof -ti tcp:3001 | xargs kill -9` y volvé a correr `pnpm dev`.
3. **Si la UI levanta pero la API no:** estás corriendo `pnpm -C client dev` por separado.
   Levantá todo junto con `pnpm dev` desde la raíz.

### La API arranca pero el envío falla con error de autenticación

Eso sí es la contraseña de aplicación. Tiene que ser una de 16 caracteres de Google
(Seguridad → Contraseñas de aplicaciones), no la contraseña normal de la cuenta, y la
cuenta tiene que tener 2FA activo.
