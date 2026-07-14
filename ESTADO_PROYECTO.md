# Estado de desarrollo - Dashboard Hypezone

Fecha de corte: 2026-07-10

Este documento resume donde quedo la generacion del dashboard Hypezone para que otro agente pueda retomar el trabajo sin perder contexto.

## Resumen ejecutivo

El proyecto ya tiene una arquitectura Angular 20 standalone avanzada para un dashboard de tienda online de ropa. Existen rutas, layout privado, login, modelos, repositorios Firestore, servicios de Auth/Cloudinary/Ventas, componentes compartidos y pantallas funcionales para resumen, lotes, productos y ventas.

El proyecto compila correctamente con `npm run build`. Queda pendiente configurar credenciales reales de Firebase/Cloudinary y probar flujos contra un proyecto Firebase real.

## Stack detectado

- Angular 20 standalone.
- Angular Material.
- Angular Fire / Firebase Auth / Cloud Firestore.
- HttpClient para Cloudinary, sin SDK de Cloudinary.
- Reactive Forms.
- Signals en componentes donde aplica.
- Lazy loading mediante `loadComponent`.

## Archivos principales creados

### Configuracion

- `src/app/app.config.ts`
  - Configura router, HttpClient, animaciones, Firebase App, Auth, Firestore y date adapter.
- `src/environments/environment.ts`
  - Tiene placeholders para Firebase y Cloudinary.
- `src/environments/environment.prod.ts`
  - Existe, revisar que tenga la misma estructura que `environment.ts`.
- `src/custom-theme.scss`
  - Existe archivo de tema.
- `src/styles.css`
  - Contiene estilos globales dark/streetwear, login, layout, cards, tablas, formularios, uploader y responsive.

### Rutas

- `src/app/app.routes.ts`
  - `/auth/login`
  - `/dashboard`
  - `/dashboard/resumen`
  - `/dashboard/lotes`
  - `/dashboard/lotes/nuevo`
  - `/dashboard/lotes/:id`
  - `/dashboard/productos`
  - `/dashboard/productos/nuevo`
  - `/dashboard/productos/:id`
  - `/dashboard/ventas`
  - `/dashboard/configuracion`

### Core

- `src/app/core/services/auth.service.ts`
  - Login con email/password.
  - Logout.
  - Estado de sesion con observable y signals.
- `src/app/core/services/cloudinary.service.ts`
  - `uploadImage(file)`
  - `uploadImages(files)`
  - `isValidImageType(file)`
  - Usa endpoint `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`.
- `src/app/core/services/venta.service.ts`
  - Registra venta y debe actualizar producto a vendido.
- `src/app/core/guards/auth.guard.ts`
  - Protege rutas privadas.
- `src/app/core/guards/public.guard.ts`
  - Evita volver al login si ya hay sesion.
- `src/app/core/repositories/base.repository.ts`
- `src/app/core/repositories/firestore.repository.ts`
- `src/app/core/repositories/producto.repository.ts`
- `src/app/core/repositories/lote.repository.ts`
- `src/app/core/repositories/venta.repository.ts`
- `src/app/core/repositories/user.repository.ts`

### Modelos

- `src/app/core/models/base.model.ts`
- `src/app/core/models/producto.model.ts`
- `src/app/core/models/lote.model.ts`
- `src/app/core/models/venta.model.ts`
- `src/app/core/models/user-profile.model.ts`

Los modelos ya contemplan una estructura mas completa que la inicial, incluyendo campos como `activo`, fechas, precios, estado, lote, imagenes y preparacion para futuro multi-tienda con `tenantId` / `storeId` donde aplica.

### Shared

- `src/app/shared/components/page-header/page-header.component.ts`
- `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`
- `src/app/shared/components/image-uploader/image-uploader.component.ts`
- `src/app/shared/components/status-chip/status-chip.component.ts`
- `src/app/shared/components/empty-state/empty-state.component.ts`
- `src/app/shared/components/loading/loading.component.ts`

### Features

- `src/app/features/auth/login/login.component.ts`
  - Login moderno estilo modal oscuro.
  - Formulario reactivo email/password.
  - Mensajes de error.
- `src/app/features/dashboard/layout/dashboard-layout.component.ts`
  - Sidebar, toolbar superior, menu de cuenta y logout.
  - Responsive con `BreakpointObserver`.
- `src/app/features/dashboard/resumen/resumen.component.ts`
  - Cards de metricas.
  - Ultimas ventas.
  - Alertas de stock/estado.
- `src/app/features/dashboard/lotes/lotes.component.ts`
  - Lista de lotes.
  - Crear/editar/detalle de lote.
  - Metricas del lote.
  - Productos asociados al lote.
- `src/app/features/dashboard/productos/productos.component.ts`
  - Lista con filtros.
  - Crear/editar/detalle.
  - Borrado logico/restaurar.
  - Cambio rapido de precio.
  - Uploader de imagenes.
  - Registro de venta desde producto.
- `src/app/features/dashboard/ventas/ventas.component.ts`
  - Registrar venta seleccionando producto disponible.
  - Calculo de resumen.
  - Listado y filtros por producto, metodo y fecha.
- `src/app/features/dashboard/configuracion/configuracion.component.ts`
  - Existe, revisar alcance actual.

## Estado por requisito

| Requisito | Estado |
|---|---|
| Firebase en `app.config.ts` | Implementado con placeholders en environment |
| Environment Firebase/Cloudinary | Implementado con placeholders |
| AuthService | Implementado |
| Guards auth/public | Implementado |
| Repositorios Firestore | Implementados |
| Modelos | Implementados |
| Layout dashboard | Implementado |
| Login moderno | Implementado |
| CRUD lotes | Parcial/avanzado: crear, editar, detalle, metricas |
| CRUD productos | Parcial/avanzado: crear, editar, detalle, borrado logico, restaurar, filtros, precio rapido |
| Cloudinary | Implementado por HttpClient |
| Registro de ventas | Implementado |
| Dashboard resumen | Implementado |
| Estilos globales | Implementados |
| Build funcional | Implementado, compila con warning de budget |

## Resultado de verificacion

Comando ejecutado:

```bash
npm run build
```

Resultado: compilacion exitosa.

Advertencia restante:

```txt
bundle initial exceeded maximum budget. Budget 500.00 kB was not met by ~250 kB
```

Este warning no bloquea la app. Se puede resolver mas adelante ajustando budgets en `angular.json` o reduciendo dependencias/carga inicial.

Correcciones aplicadas despues del estado inicial:

1. Se corrigieron inicializadores de clase que usaban dependencias del constructor antes de tiempo.
   - Componentes afectados: login, lotes, productos, resumen y ventas.
   - Se migro a `inject(...)` en propiedades privadas.
2. Se corrigio la expresion invalida con `async` pipe dentro de `(click)` en el sidebar.
3. Se corrigio el `dataSource` nullable de la tabla de lotes.
4. La primera fase de migracion normalizo 23 productos al esquema `schemaVersion: 2`, sin cambiar IDs ni eliminar los campos antiguos `precio` e `imagen`. La auditoria posterior reporto cero pendientes.
5. `VentaService` registra ventas mediante `runTransaction()` de Firestore. Dentro de la transaccion vuelve a leer el producto, valida existencia, actividad, estado y precio, crea el snapshot historico de la venta y marca el producto como vendido.
6. Antes de la transaccion se comprueba que no exista otra venta activa para el mismo `productoId`. La relectura transaccional del estado evita dos ventas concurrentes aunque dos clientes intenten confirmar al mismo tiempo.
7. Los campos opcionales `loteId`, `clienteNombre`, `clienteTelefono` y `notas` solo se guardan cuando existen. El snapshot de venta usa `schemaVersion: 2` y timestamps del servidor.
8. Ambos formularios de venta deshabilitan su boton durante la operacion y muestran mensajes especificos para productos vendidos, reservados, agotados, inactivos y precios invalidos.
9. El dashboard conserva productos como fuente de inventario, pero obtiene `totalVendido`, `gananciaReal` y ultimas ventas exclusivamente de ventas activas.
10. La tercera fase centraliza las métricas de lotes en `LoteAnalyticsService`: productos activos son la fuente de inventario e inversión, y ventas activas con `loteId` son la fuente de ingresos, vendidos y ganancia real.
11. `cantidadProductos` se conserva solo por compatibilidad, se inicializa en cero y ya no es editable ni se usa en cálculos.
12. `fechaCompra` se guarda como `Timestamp` en lotes nuevos o editados; el helper de lectura tolera Timestamp, Date y strings ISO antiguos.
13. El detalle de lote permite crear productos vinculados, asociar productos sin lote, desvincular con `deleteField()`, consultar ventas y detectar diferencias entre costo declarado e inversión asignada.
14. Los lotes admiten baja lógica conservando vínculos o desvinculando productos activos en batch. Restaurar el lote no reasigna productos y la UI nunca expone `hardDelete()`.
15. Se agregaron pruebas unitarias del dominio de analítica de lotes y la documentación `LOTE_DOMAIN.md`.

## Limpieza final del esquema de productos

- La compatibilidad de lectura con `precio` e `imagen` fue retirada del modelo, normalizadores,
  helpers y analítica de lotes. La aplicación usa `precioCompra`, `precioVenta` e `imagenes`.
- La migración anterior fue retirada del código ejecutable. La nueva ruta temporal manual es
  `/dashboard/limpieza-productos`.
- `ProductoCleanupService` audita primero, bloquea documentos incompletos, elimina campos antiguos y
  opcionales exactamente vacíos en batches de hasta 400, eleva `schemaVersion` a 3 y vuelve a auditar.
- La herramienta no se ejecuta automáticamente, no elimina productos y no invoca Cloudinary.
- `precioOferta` conserva el cero explícito; un control vacío omite el campo.
- El procedimiento y la reversión desde backup están en `LIMPIEZA_PRODUCTOS.md`.

## Pendientes tecnicos recomendados

1. Reemplazar placeholders de Firebase y Cloudinary por credenciales reales cuando corresponda.
2. Verificar reglas e indices de Firestore, especialmente consultas con `where` + `orderBy`.
3. Revisar si `MatPaginator` y `MatSort` deben conectarse a `MatTableDataSource`; ahora algunas tablas usan arrays directos.
4. Revisar UX de detalle de producto: existe uploader y preview, pero puede ampliarse a galeria con eliminacion/reordenamiento de imagenes.
5. Revisar eliminacion logica en lotes y ventas. Productos ya tienen borrado logico/restaurar.
6. Agregar manejo mas completo de loading/empty/error en pantallas principales.
7. Agregar tests basicos para servicios criticos: Auth, Cloudinary, VentaService y repositorios.
8. Optimizar budget inicial si se quiere eliminar el warning de build.

## Nota sobre Git

Al ejecutar `git status --short`, Git rechazo el repo por `dubious ownership` dentro del sandbox:

```txt
fatal: detected dubious ownership in repository
```

No se modifico la configuracion global de Git. Si otro agente necesita usar Git, debe resolverlo explicitamente, por ejemplo agregando este repo como `safe.directory` si el usuario lo permite.

## Siguiente paso sugerido para retomar

Para retomar desde aqui:

1. Configurar credenciales reales en `src/environments/environment.ts` y `src/environments/environment.prod.ts`.
2. Crear/habilitar usuario en Firebase Authentication.
3. Revisar reglas de Firestore para `users`, `lotes`, `productos` y `ventas`.
4. Levantar `npm start` y probar login, crear lote, crear producto, subir imagen, registrar venta y revisar resumen.
