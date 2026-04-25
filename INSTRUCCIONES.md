# ⬡ Iron Log — Instrucciones de instalación

## Paso 1 — Instalar Node.js
Descarga e instala Node.js LTS desde: https://nodejs.org
(Elige la versión LTS, botón verde grande)

## Paso 2 — Configurar tu usuario de GitHub
Abre el archivo `vite.config.js` y cambia esta línea:
```
const GITHUB_USER = 'TU_USUARIO'
```
Por tu nombre de usuario real de GitHub, por ejemplo:
```
const GITHUB_USER = 'juangarcia'
```

## Paso 3 — Crear el repositorio en GitHub
1. Ve a github.com e inicia sesión
2. Crea un repositorio nuevo llamado exactamente: `iron-log`
3. Márcalo como **Public**
4. NO inicialices con README

## Paso 4 — Abrir terminal en la carpeta del proyecto
- **Windows**: clic derecho en la carpeta `iron-log` → "Abrir en Terminal"
- **Mac**: clic derecho → "Nueva Terminal en carpeta"

## Paso 5 — Instalar dependencias
```bash
npm install
```
(tarda 1-2 minutos la primera vez)

## Paso 6 — Compilar y publicar
```bash
npm run deploy
```
Este comando:
1. Compila la app (genera la carpeta `dist/`)
2. La sube automáticamente a GitHub Pages

## Paso 7 — Activar GitHub Pages
1. Ve a tu repositorio en github.com
2. Pestaña **Settings** → sección **Pages**
3. En "Branch" selecciona **gh-pages** y carpeta **/ (root)**
4. Pulsa **Save**

Tu app estará en:
```
https://TU_USUARIO.github.io/iron-log/
```
(espera 1-2 minutos)

---

## Instalar en Android
1. Abre la URL en **Chrome** en tu Android
2. Menú ⋮ → **"Añadir a pantalla de inicio"**
3. Pulsa **Instalar**

La app queda instalada como nativa, con icono propio y sin barra del navegador.

---

## Dónde se guardan los datos
En **IndexedDB** del navegador Chrome en tu Android. Los datos persisten aunque cierres la app. Solo se borran si borras los datos de Chrome o desinstalas el navegador.

## Para actualizar la app en el futuro
Después de hacer cambios en el código, simplemente ejecuta de nuevo:
```bash
npm run deploy
```

## Desarrollo local
Para probar la app en tu PC antes de publicar:
```bash
npm run dev
```
Abre http://localhost:5173 en tu navegador.
