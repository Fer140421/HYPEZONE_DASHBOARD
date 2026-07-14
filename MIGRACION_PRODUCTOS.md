# Migracion temporal de productos (archivada)

> Estado histórico: esta migración ya fue completada y su ruta y servicio fueron retirados. La
> limpieza final manual está documentada en `LIMPIEZA_PRODUCTOS.md`.

Esta herramienta normaliza documentos existentes de la coleccion `productos`. No se ejecuta al
iniciar la aplicacion: requiere una auditoria manual y una confirmacion explicita desde la vista
`/dashboard/migracion-productos`.

## Que transforma

Solo se actualizan productos que tengan algun dato pendiente de normalizacion:

- `precioVenta = precioVenta ?? precio ?? 0`
- `precioCompra = precioCompra ?? 0`
- `activo = activo ?? true`
- `estado = estado ?? 'disponible'`
- `schemaVersion = schemaVersion ?? 2`
- `imagenes` se conserva si ya es array; un string se convierte en un array de un elemento.
- Si falta `imagenes`, se usa `imagen` como array o como string convertido a array.
- Si no existe ninguna imagen, se escribe `imagenes: []`.
- `createdAt` se agrega con `serverTimestamp()` solamente cuando no existe o es `null`.
- `updatedAt` se actualiza con `serverTimestamp()` en cada producto que se migra.

Los valores `undefined` se eliminan recursivamente antes de enviarlos a Firestore. La herramienta
no crea `loteId` cuando no existe.

## Que no elimina ni modifica

- No borra documentos.
- No cambia IDs.
- No elimina los campos antiguos `precio` e `imagen`.
- No modifica las colecciones `lotes` ni `ventas`.
- No sobrescribe valores nuevos que ya existen, salvo normalizar `imagenes` cuando no es un array.
- No vuelve a escribir productos ya normalizados. Por eso puede ejecutarse varias veces sin
  duplicar imágenes ni degradar datos.

## Preparacion recomendada

1. Crear una exportacion o backup de Firestore antes de cualquier escritura.
2. Verificar que el usuario autenticado tenga permisos de lectura y actualizacion en `productos`.
3. Desplegar o ejecutar localmente esta version de la aplicacion.
4. No compartir la ruta administrativa con usuarios no autorizados. El guard actual exige sesion,
   pero no comprueba un rol administrativo.

## Como ejecutarla

1. Iniciar sesion en Hypezone.
2. Abrir **Migrar productos** en el menu o navegar a `/dashboard/migracion-productos`.
3. Pulsar **Ejecutar auditoria**.
4. Revisar total de productos, pendientes, productos con `precio` y productos con `imagen`.
5. Pulsar **Ejecutar migracion**.
6. Leer la confirmacion y confirmar solo si los conteos son correctos.
7. Esperar el resultado final. Las escrituras se dividen en batches de hasta 400 operaciones.

La herramienta nunca ejecuta la migracion automaticamente.

## Como verificar resultados

La propia vista ejecuta una auditoria posterior. El valor **Pendientes despues de verificar** debe
ser `0`. Tambien se recomienda:

1. Volver a ejecutar manualmente la auditoria; debe mostrar cero pendientes.
2. Comparar el total de documentos con el backup; debe ser el mismo.
3. Revisar una muestra de productos con precio e imagen antiguos.
4. Confirmar que conservan `precio` e `imagen` y que ahora tienen los campos normalizados.
5. Confirmar que los IDs no cambiaron y que productos sin lote siguen sin `loteId`.
6. Verificar que `createdAt` existente no fue reemplazado.

## Reversion usando el backup

La herramienta no implementa una reversion automatica. Si fuera necesario revertir:

1. Detener nuevas escrituras de productos para evitar mezclar cambios posteriores.
2. Conservar una segunda exportacion del estado posterior para diagnostico.
3. Restaurar la exportacion previa mediante las herramientas administrativas de Firebase/Google
   Cloud usadas para crear el backup.
4. Verificar conteos e IDs despues de la restauracion.
5. No intentar revertir eliminando manualmente campos sin una copia previa: podria eliminar datos
   legitimos creados despues de la migracion.

Cuando la migracion haya sido verificada y ya no sea necesaria, se debe retirar la ruta, su entrada
de menu y el servicio temporal en un cambio posterior independiente.
