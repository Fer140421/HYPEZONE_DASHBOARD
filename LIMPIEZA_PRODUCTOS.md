# Limpieza final del esquema de productos

La herramienta temporal de `/dashboard/limpieza-productos` elimina de Firestore la compatibilidad
residual del esquema anterior. Nunca se ejecuta al iniciar la aplicación: exige una auditoría manual,
que no escribe datos, y una confirmación explícita antes de crear batches.

## Condición previa

Antes de habilitar la limpieza, todos los documentos de `productos` deben tener `precioVenta`,
`precioCompra` e `imagenes` como array. La pantalla bloquea toda escritura si falta cualquiera de
ellos. Se recomienda crear y comprobar un backup de Firestore, verificar permisos de actualización
y evitar escrituras concurrentes sobre productos durante la operación.

## Campos eliminados

- `precio`
- `imagen`
- `marca`, `color`, `codigo` y `notas` solo cuando su valor es exactamente `''`

Cada documento pendiente recibe `schemaVersion: 3` y un nuevo `updatedAt` mediante
`serverTimestamp()`. La operación no elimina documentos, no cambia IDs, no crea `loteId`, no escribe
valores `null` o `undefined` y se divide en batches de hasta 400 documentos.

## Campos conservados

La limpieza nunca elimina `nombre`, `descripcion`, `categoria`, `talla`, `estado`, `precioCompra`,
`precioVenta`, `precioOferta`, `imagenes`, `activo`, `createdAt` ni `loteId`. Los campos opcionales con
un valor distinto de la cadena vacía también se conservan.

## Firestore y Cloudinary son operaciones distintas

Eliminar `imagen` solo borra una referencia del documento en Firestore; no elimina el archivo remoto
de Cloudinary. Esta herramienta no llama a `CloudinaryService`, a una Cloud Function ni a ninguna API
de destrucción de archivos. Las URLs vigentes permanecen en el array `imagenes`.

## Cómo ejecutar

1. Crear un backup de Firestore y registrar su fecha y ubicación.
2. Iniciar sesión con un usuario autorizado.
3. Abrir **Limpiar productos** o navegar a `/dashboard/limpieza-productos`.
4. Pulsar **Ejecutar auditoría** y revisar todos los contadores.
5. Confirmar que `Sin precioVenta`, `Sin precioCompra` y `Sin imagenes` sean cero.
6. Revisar `Listos para limpieza` y pulsar **Ejecutar limpieza**.
7. Leer la advertencia y confirmar manualmente la escritura.

## Cómo verificar

La auditoría automática posterior debe mostrar el número esperado de productos limpiados, todos los
batches confirmados, cero pendientes y todos los productos esperados con `schemaVersion: 3`. Repetir
la auditoría manual debe mostrar cero campos antiguos. Una segunda ejecución es idempotente: debe
haber cero productos listos y el botón de limpieza debe permanecer deshabilitado.

También conviene comparar el total y los IDs con el backup y probar productos, lotes, ventas, resumen
e imágenes desde la aplicación.

## Cómo revertir desde backup

No existe reversión automática. Para volver atrás:

1. Detener temporalmente las escrituras sobre `productos`.
2. Exportar el estado posterior si se necesita conservarlo para diagnóstico.
3. Restaurar la exportación previa con las herramientas administrativas de Firebase/Google Cloud.
4. Verificar el total, los IDs y una muestra de documentos restaurados.
5. Desplegar una versión del código compatible con el esquema restaurado antes de reabrir escrituras.

No debe intentarse reconstruir los campos eliminados sin backup, especialmente si hubo cambios de
productos después de la limpieza.
