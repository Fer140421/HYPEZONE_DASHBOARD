# Autenticación y roles (DEV)

Esta fase usa Firebase Authentication para identidad y `users/{uid}` en Firestore para el perfil administrativo. Es una implementación **provisional para DEV**: no se desplegaron reglas ni se escribieron datos.

## Roles y permisos iniciales

| Permiso | owner | admin | seller |
| --- | --- | --- | --- |
| Gestionar usuarios y configuración | Sí | No | No |
| Productos: ver | Sí | Sí | Sí |
| Productos: crear, editar, precio, eliminar | Sí | Sí | No |
| Lotes, proveedores y catálogos | Sí | Sí | No |
| Clientes y registrar ventas | Sí | Sí | Sí |
| Editar ventas, reportes y ver costos | Sí | Sí | No |
| Limpieza de productos | Sí | No | No |

`AuthService` es la fuente central: expone `role`, `isOwner`, `isAdmin`, `isSeller` y `can(permission)`. Guards, navegación y acciones sensibles usan esa API. Ocultar una opción no sustituye los guards ni las reglas.

## Documento requerido

Ruta: `users/{uid}`

```ts
{
  uid: 'UID_DE_FIREBASE_AUTH',
  email: 'owner-dev@example.com',
  displayName: 'Owner DEV',
  role: 'owner', // 'owner' | 'admin' | 'seller'
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Los timestamps siguen el patrón del proyecto: `serverTimestamp()` al crear o actualizar. Angular no crea perfiles, no asigna roles y no realiza escrituras administrativas de usuarios.

## Crear el primer owner DEV manualmente

1. Selecciona el proyecto Firebase DEV en la consola.
2. Crea el usuario de email/password en Firebase Authentication DEV.
3. Copia su UID.
4. Crea manualmente el documento `users/{UID}` con el ejemplo anterior, `role: 'owner'` y `active: true`.
5. Inicia sesión en el dashboard DEV.

## Estados de sesión

- `initializing` / `loading-profile`: Auth o la lectura de perfil aún no resolvieron; los guards esperan, sin redirección prematura.
- `unauthenticated`: se redirige a login.
- `missing-profile`: acceso bloqueado y mensaje “Tu cuenta no tiene un perfil administrativo configurado”.
- `inactive`: acceso bloqueado y mensaje “Tu cuenta está desactivada”.
- `error`: acceso bloqueado con mensaje de verificación fallida.
- `authenticated`: perfil existente, activo y apto para guards por rol.

## Guards y Security Rules

Los guards protegen navegación y UX. Las Security Rules protegen Firestore ante URL directa, DevTools o clientes externos. Ninguno reemplaza al otro.

`firestore.rules` es una propuesta local DEV: deniega por defecto, permite al usuario leer solo su perfil, reserva la gestión de `users` para owner, impide borrado físico de ventas y no permite acceso anónimo a datos privados. La regla temporal para seller sobre productos es document-wide; no garantiza ocultar costos u otros campos privados. La siguiente fase debe crear vistas/modelos de lectura específicos y reglas por datos, además de mover la autorización principal a custom claims con Admin SDK y Cloud Functions.

No hay todavía ruta de usuarios, reportes o auditoría: los permisos se reservaron en la matriz, sin inventar pantallas.
