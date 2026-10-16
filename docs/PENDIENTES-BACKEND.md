# Pendientes para backend

Lo que el frontend ya no puede resolver por su cuenta. Cada punto indica qué falta, por qué, qué tocar y cómo se ve hoy mientras tanto.

Estado a 15 de octubre de 2026. Prioridad: **Alta** bloquea una función visible; **Media** mejora una función que ya existe; **Baja** es optimización u operación.

---

## Resumen

| # | Pendiente | Prioridad | Tipo |
|---|-----------|-----------|------|
| 1 | Nombre del usuario en la sesión | Alta | Endpoint |
| 2 | Autor de los comentarios en el detalle público | Alta | Consulta |
| 3 | Coordinador: consultar profesores y estudiantes | Alta | Permisos + endpoint |
| 4 | Profesor: «Mis estudiantes» | Media | Endpoint |
| 5 | Semilleros en el portal público | Media | Endpoint |
| 6 | Descripción e ícono de las escuelas | Media | Modelo + migración |
| 7 | Pagos pendientes en una sola consulta | Baja | Endpoint |
| 8 | Borrar el comentario propio | Baja | Endpoint |
| 9 | Archivos subidos que no están en el volumen de Docker | Media | Operación |
| 10 | Origen `localhost:8080` en Google Cloud | Media | Configuración externa |

---

## 1. Nombre del usuario en la sesión

**Qué falta:** `POST /api/auth/login` y `POST /api/auth/google` devuelven `usuario` solo con `id_usuario`, `email`, `id_rol`, `primer_login` y `perfil_pendiente`.

**Por qué importa:** el panel saluda «Buenas tardes» sin nombre y la tarjeta de la barra lateral muestra el correo. No hay ningún endpoint para que un coordinador o un profesor lea su propio perfil (`/api/usuarios/:id` es solo del Administrador).

**Qué tocar:** cualquiera de estas dos opciones.
- Añadir `nombres` y `apellidos` al objeto `usuario` de la respuesta de login y Google (`auth.service.ts`). No hace falta meterlos en el JWT.
- O crear `GET /api/auth/me` (autenticado) que devuelva el perfil propio sin datos sensibles.

**Hoy:** el front ya lee `nombres` y `apellidos` si llegan (`AuthService.User`). Si no llegan, usa el correo. No hace falta cambiar nada del front cuando el backend los envíe.

---

## 2. Autor de los comentarios en el detalle público

**Qué falta:** `GET /api/public/proyectos/:id` devuelve `comentarios` con `id_usuario`, pero sin nombre.

**Por qué importa:** la ficha del proyecto muestra cada comentario como «Tú» o «Miembro de la comunidad».

**Qué tocar:** en la consulta del detalle público, incluir el autor con un `select` acotado (nunca el usuario completo, por el `password_hash`):

```ts
comentarios: {
  where: activo,
  include: { usuario: { select: { id_usuario: true, nombres: true, apellidos: true } } },
}
```

**Hoy:** el front ya lista los comentarios, los publica con `POST /api/proyectos/:id/comentarios` y muestra las respuestas en hilo.

---

## 3. Coordinador: consultar profesores y estudiantes

**Qué falta:** todo `/api/usuarios` exige rol Administrador (`usuario.routes.ts`, `router.use(... requireRole(['Administrador']))`).

**Por qué importa:** en el panel del coordinador, «Profesores» y «Estudiantes» siguen en «Pronto». Si se habilitaran, el coordinador recibiría 403.

**Qué tocar:** un listado de solo lectura para el Coordinador, por ejemplo `GET /api/usuarios/consulta?rol=Profesor|Estudiante`, con campos básicos (nombre, correo, escuela, activo). Sin crear, editar ni suspender.

**Hoy:** las dos opciones están deshabilitadas con la etiqueta «Pronto».

---

## 4. Profesor: «Mis estudiantes»

**Qué falta:** no hay un endpoint que devuelva los estudiantes vinculados a un profesor.

**Qué tocar:** `GET /api/profesores/me/estudiantes`, que una a los autores de los proyectos que coordina y a los miembros de los semilleros que lidera, sin repetidos.

**Hoy:** la opción está en «Pronto». Ya no muestra el contador «2», que era un número de ejemplo.

---

## 5. Semilleros en el portal público

**Qué falta:** `GET /api/semilleros` exige sesión. No hay una versión en `/api/public`.

**Por qué importa:** los visitantes del portal no pueden ver los semilleros (solo los estudiantes con sesión, en `/semilleros`).

**Qué tocar:** `GET /api/public/semilleros` con los semilleros activos: nombre, descripción, escuela, líder (solo nombre) y número de miembros aprobados.

---

## 6. Descripción e ícono de las escuelas

**Qué falta:** la tabla `escuelas` solo tiene `nombre_escuela`.

**Por qué importa:**
- La página de cada escuela usa un texto genérico como descripción.
- El ícono y el color se deducen del nombre. Una escuela nueva cuyo nombre no coincida recibe el ícono institucional genérico, siempre el mismo.

**Qué tocar:** migración con `descripcion TEXT NULL`, `icono VARCHAR(50) NULL` (clave de un catálogo cerrado, no texto libre) y `color VARCHAR(7) NULL`. Después, admitirlos en `escuelaSchema` y en los `select` públicos.

**Hoy:** el front ya tiene el respaldo genérico y no se rompe con escuelas nuevas.

---

## 7. Pagos pendientes en una sola consulta

**Qué falta:** para mostrar «Pagos por confirmar», el dashboard del administrador pide la lista de inscripciones **de cada evento con pago**: una petición por evento.

**Qué tocar:** `GET /api/inscripciones?estado_pago=pendiente&limit=5` (Administrador), con el nombre del evento.

**Hoy:** funciona, pero escala mal con muchos eventos.

---

## 8. Borrar el comentario propio

**Qué falta:** existe `POST /api/proyectos/:id/comentarios`, pero no hay forma de borrar un comentario.

**Qué tocar:** `DELETE /api/proyectos/:id/comentarios/:idComentario` (borrado lógico), permitido al autor y al Administrador.

---

## 9. Archivos subidos que no están en el volumen de Docker (operación)

**Qué pasa:** el flyer del evento 2 (`/uploads/eventos/2/flyer-...jpg`) devuelve **404**. El archivo sí existe en `unilab_back/uploads/` del repositorio, pero el contenedor `api` sirve `/app/uploads` desde el volumen `uploads_data`, que no lo tiene.

**Qué hacer:** copiar `unilab_back/uploads/` al volumen, por ejemplo con `docker cp unilab_back/uploads/. <contenedor_api>:/app/uploads/`, o volver a subir el flyer desde el panel. A futuro, decidir si `uploads/` debe estar en Git.

**Hoy:** el front muestra una imagen de respaldo con la fecha del evento en lugar de un hueco.

---

## 10. Origen `localhost:8080` en Google Cloud (configuración externa)

**Qué pasa:** el botón «Continuar con Google» responde *«The given origin is not allowed for the given client ID»*.

**Qué hacer:** en Google Cloud Console → Credenciales → el client ID OAuth, añadir `http://localhost:8080` (y el dominio de producción) a **Orígenes autorizados de JavaScript**.

---

## Decisiones de producto (no son errores)

- **Aprobar proyectos desde el panel de Administrador o Coordinador:** hecho en el front. El backend ya lo permitía (`verificarPermisoGestion`); ahora Admin y Coordinador ven Aprobar, Rechazar y Publicar en la ficha del panel. No requiere cambios de backend.
- **Responder comentarios:** hecho en el front. Cada comentario tiene «Responder» (con sesión) y envía `id_comentario_padre`. No requiere cambios de backend.
- **URL de la API:** el front tiene `http://localhost:3000/api` escrito en sus servicios. Para desplegar fuera de local conviene moverla a una configuración por entorno (front).
