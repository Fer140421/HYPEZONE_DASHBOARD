# Firebase Environments

## Estado actual

- El proyecto Firebase `hypezone-3ed2a` debe tratarse como `PROD`.
- El dashboard no debe ejecutarse en desarrollo contra `hypezone-3ed2a`.
- El nuevo proyecto Firebase de desarrollo todavia debe crearse y configurarse.

## Archivos de entorno

- `src/environments/environment.ts`
  - Base segura local.
  - No apunta a produccion.
- `src/environments/environment.development.ts`
  - Usado por `ng serve` y `ng build --configuration development`.
- `src/environments/environment.production.ts`
  - Usado por `ng build --configuration production`.
  - Contiene la configuracion web actual de `hypezone-3ed2a`.

## Campos que debes completar manualmente

Cuando tengas el proyecto Firebase DEV, reemplaza los placeholders de:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`

Campos a completar:

- `firebase.apiKey`
- `firebase.authDomain`
- `firebase.projectId`
- `firebase.storageBucket`
- `firebase.messagingSenderId`
- `firebase.appId`
- `cloudinary.cloudName`
- `cloudinary.uploadPreset`

## Como obtener la configuracion web de Firebase DEV

1. Abre Firebase Console.
2. Entra al proyecto de desarrollo.
3. Ve a `Project settings`.
4. En la seccion `Your apps`, crea o abre la app web del dashboard.
5. Copia la configuracion web y colócala en los archivos de entorno DEV.

## Comandos

- Desarrollo: `npm run start:dev`
- Build DEV: `npm run build:dev`
- Build PROD: `npm run build:prod`
- Seleccionar alias DEV: `npm run firebase:use:dev`
- Seleccionar alias PROD: `npm run firebase:use:prod`
- Emuladores: `npm run emulators`

## Seleccion de configuraciones

- `ng serve`
  - Usa la configuracion `development`.
  - Reemplaza `src/environments/environment.ts` por `src/environments/environment.development.ts`.
- `ng serve --configuration development`
  - Usa `environment.development.ts`.
- `ng build`
  - Usa la configuracion por defecto `production`.
- `ng build --configuration production`
  - Usa `environment.production.ts`.

## Verificacion visual de DEV

- En desarrollo debe aparecer la etiqueta `ENTORNO DE DEV` en la barra superior del dashboard.
- En produccion esa etiqueta no debe aparecer.

## Validaciones de seguridad

Al iniciar la app:

- si un entorno no productivo apunta a `hypezone-3ed2a`, la app falla de forma explicita;
- si `DEV` no tiene `projectId` real configurado, la app falla de forma explicita.

## Firebase CLI

Archivos iniciales creados:

- `.firebaserc`
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

Aliases definidos:

- `dev` -> `HYPEZONE_DEV_PROJECT_ID`
- `prod` -> `hypezone-3ed2a`

## Advertencias importantes

- No uses `ng serve` hasta reemplazar los placeholders DEV por credenciales reales.
- No desplegar `firestore.rules` todavia.
- Antes de cualquier deploy futuro, copia y revisa las reglas reales actualmente publicadas en Firebase.
- Esta fase no crea Functions, no configura Hosting y no despliega cambios.

## Pendientes manuales en Firebase Console

1. Crear el proyecto Firebase DEV.
2. Crear la app web del dashboard en DEV.
3. Obtener la configuracion web DEV.
4. Configurar Authentication y Firestore en DEV.
5. Revisar y exportar las reglas reales de produccion antes de versionarlas localmente.
