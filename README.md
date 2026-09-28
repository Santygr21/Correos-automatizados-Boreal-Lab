# Correos automáticos

Herramienta minimalista para enviar correos personalizados a una lista de contactos usando React (Vite) + Node + Nodemailer.

## Estructura

```
package.json  Scripts raíz (pnpm dev levanta api + web a la vez)
server/       API Express + Nodemailer (puerto 3001)
client/       UI React con Vite (puerto 5173, proxy a /api)
```

## Requisitos

- Node.js 18+
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- Una cuenta Gmail con **contraseña de aplicación** (activa 2FA primero en tu cuenta de Google → Seguridad → Contraseñas de aplicaciones)

## Uso

1. Instalar dependencias (una vez):

```bash
pnpm install        # solo el package.json raíz (concurrently)
pnpm install:all    # las de server y client
```

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
