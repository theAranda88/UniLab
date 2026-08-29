# 🚀 QUICK START — Sistema SDD UniLab

Bienvenido. Este documento es tu guía rápida para empezar con el sistema SDD coordinado de UniLab.

---

## 📍 ¿Dónde Estoy?

Trabajas en una **plataforma universitaria modular** con:
- **Backend:** Node.js + Express + Prisma + PostgreSQL
- **Frontend:** Angular 17+ con Signals + i18n
- **5 Roles fijos:** Administrador, Coordinador, Profesor, Estudiante, Externo
- **Módulos:** Usuarios, Proyectos, Semilleros, Eventos

---

## 🎯 Paso 1: Elige tu Tarea

Tengo 8 skills para ayudarte. **Elige el que más se parece a lo que necesitas:**

| # | Skill | Para Qué | Ejemplo |
|---|-------|---------|---------|
| 1 | `backend-crud` | Tabla nueva + CRUD en backend | "Agregar tabla 'Calificación'" |
| 2 | `frontend-crud` | Interfaz para CRUD existente | "Crear listado de Eventos" |
| 3 | `backend-feature` | Lógica compleja en backend | "Flujo de autorización de publicación" |
| 4 | `frontend-feature` | UI compleja con múltiples pasos | "Modal multi-paso para crear proyecto" |
| 5 | `auth-flow` | Login, password, permisos | "Agregar 2FA" |
| 6 | `i18n-feature` | Traducir nuevas secciones | "Traducir página de Eventos" |
| 7 | `debug-fix` | Error o comportamiento inesperado | "Login no funciona en iOS" |
| 8 | `refactor` | Mejorar código sin cambiar función | "Refactorizar service de Proyectos" |

---

## 📝 Paso 2: Comunica en el Chat

**⚠️ IMPORTANTE:** Documentación Swagger + Postman es **OBLIGATORIA** para backend.
- Si necesitas `backend-crud`: tu skill incluye pasos de documentación
- Si necesitas `backend-to-frontend-integration`: validará que backend esté documentado primero
- Ref: [DOCUMENTACION.md](./DOCUMENTACION.md)

Una vez identifiques el skill, **escribe en el chat:**

```
Necesito: [NOMBRE DEL SKILL]

[Descripción siguiendo el formato sugerido en ese skill]
```

### Ejemplo 1: Backend CRUD
```
Necesito: backend-crud

Necesito agregar un modelo 'Calificación' con campos:
- puntos: integer (0-100, requerido)
- comentario: text (opcional)
- id_proyecto: FK -> Proyecto (requerido)
- id_estudiante: FK -> Usuario (requerido)

Roles: Profesor puede crear/editar, Estudiante solo ver.
¿Hay validaciones?: Sí, puntos 0-100.
```

### Ejemplo 2: Frontend CRUD
```
Necesito: frontend-crud

Necesito UI para Calificación (backend ya hecho).
Listado: proyecto, estudiante, puntos, comentario.
Formulario: puntos (rango 0-100), comentario, proyecto, estudiante.
Permisos: solo Profesor puede crear/editar.
```

### Ejemplo 3: Debug
```
Necesito: debug-fix

Síntoma: Login retorna 401 pero credenciales son correctas.
Pasos: 1. Ir a /login, 2. Ingresar admin@example.com / Password123!, 3. Click en Ingresar.
Error en consola: "401 Unauthorized".
Backend: ¿Backend está corriendo en puerto 3000? Sí.
```

---

## ⚙️ Paso 3: Espera la SPEC

El agent te presentará la **especificación** en 1 párrafo:
- Qué va a hacer
- Qué componentes/archivos se crean/modifican
- Qué permiso se requiere
- Qué validaciones

**Confirma o ajusta:**
- "✅ OK, procede" → el agent codifica
- "❌ Cambio: [lo que quiero diferente]" → agent ajusta SPEC

---

## 🔨 Paso 4: El Agent Construye

El agent:
1. ✅ Crea/modifica archivos necesarios
2. ✅ Compila backend y frontend
3. ✅ Valida que funcione
4. ✅ Prueba conversacionales (ej. "login con admin → retorna 200 + token")

**Tú solo lees y confirmas.** Si hay error, reporta en el chat.

---

## 🧭 Referencia Rápida: Reglas Transversales

Estas reglas aplican **SIEMPRE**, sin importar el skill:

### Backend Obligatorio
- 🔴 **Soft-delete SIEMPRE** — nunca `DELETE` físico. Usa `UPDATE deleted_at = NOW()`
- 🔴 **i18n en errores** — todos los mensajes de error en español
- 🔴 **Validación Zod** — schema en `schemas/index.ts` antes de controller
- 🔴 **Permiso por rol** — verifica `requireRole(['Profesor', 'Coordinador'])` en rutas
- 🔴 **Soft-delete en queries** — TODO `findMany`/`findFirst` filtra `deleted_at: null`

### Frontend Obligatorio
- 🔴 **Signals para estado** — `signal()`, `computed()`, NO variables mutables
- 🔴 **Standalone components** — `standalone: true`, sin NgModules
- 🔴 **i18n en templates** — `{{ 'key' | translate }}`, nunca hardcode texto
- 🔴 **Reactive forms** — `FormBuilder`, `Validators`, tipado
- 🔴 **TranslatePipe en imports** — si usas translate pipe, importa en component

### Ambos
- 🔴 **SDD primero** — especificación antes de código
- 🔴 **Conversacional** — NO generes `.md` de análisis, todo en el chat
- 🔴 **Una funcionalidad a la vez** — no mezcles módulos
- 🔴 **Consistencia** — busca similares antes de crear nuevo

---

## 📚 Documentos de Referencia (Lectura Opcional)

Si quieres profundizar, lee estos archivos en el proyecto:

1. **`00-esquema-bd-referencia.md`** — Modelo de BD completo (la fuente de verdad)
2. **`../rules/unilab-global.mdc`** — Instrucciones globales
3. **`../rules/backend.mdc`** — Stack y patrones backend
4. **`../rules/frontend.mdc`** — Stack y patrones frontend
5. **`.cursor/docs/ROUTER.md`** — Explicación completa de cada skill
6. **`../skills/[skill]/SKILL.md`** — Detalles paso a paso de cada skill

---

## 🎓 Ejemplo Completo: De Cero a Funcional en 5 Minutos

**Objetivo:** Agregar funcionalidad para calificar proyectos.

### Chat 1: Especificación Backend
```
Necesito: backend-crud

Agregar modelo 'Calificación' con:
- puntos: 0-100
- comentario: texto opcional
- FK a Proyecto
- FK a Usuario (estudiante)
- Profesor crea/edita, Estudiante solo ve.
```

**Agent responde:**
> SPEC: Tabla calificación en BD con 4 campos (puntos, comentario, FK proyecto, FK usuario).
> Solo Profesor puede crear/actualizar (verificado en service + middleware).
> GET /api/calificaciones retorna array, POST crea, PUT actualiza, DELETE soft-delete.
> ¿OK?

**Tú responde:**
```
✅ OK
```

**Agent construye:** 5-10 segundos, todos los archivos backend listos.

---

### Chat 2: Especificación Frontend
```
Necesito: frontend-crud

UI para Calificación (backend ya hecho).
Listado: proyecto, estudiante, puntos.
Formulario: puntos (slider 0-100), comentario (textarea), alumno select.
Botones: crear, editar, eliminar.
Profesor solo ve crear/editar, Estudiante solo ve en modo lectura.
```

**Agent responde:**
> SPEC: Componente listado con tabla. Botones CREATE/EDIT/DELETE solo si rol=Profesor.
> Formulario con reactive form + validaciones. Signals para estado.
> i18n claves: calificaciones.titulo, calificaciones.puntos, etc.
> ¿OK?

**Tú responde:**
```
✅ OK
```

**Agent construye:** 10-15 segundos, frontend funcional.

---

### Chat 3: Validación
```
¿Probamos end-to-end?
Login como profesor → crear calificación → listar → editar → eliminar.
```

**Agent** prueba en navegador y confirma:
> ✅ Login OK → Dashboard OK → Navegar a /calificaciones → Listado vacío OK
> ✅ Click "Crear" → Modal abre OK
> ✅ Llenar formulario (proyecto=Proyecto1, alumno=Juan, puntos=85, comentario="Excelente") → Guardar → 201 Created
> ✅ Listado recarga, aparece nueva calificación
> ✅ Click Editar → Modal pre-llena datos → cambiar puntos a 90 → Guardar → 200 OK
> ✅ Click Eliminar → Confirma → soft-delete exitoso (desaparece de listado)
> **FUNCIONALIDAD LISTA.**

**Total:** 2-3 minutos de chat + compilaciones automáticas.

---

## 🆘 Si Algo Falla

**En el chat:**
```
Necesito: debug-fix

Error: [COPIA EXACTA DEL ERROR]
Contexto: backend / frontend
Pasos: [CÓMO REPRODUCIR]
```

**Example:**
```
Necesito: debug-fix

Error: NG8004: No pipe found with name 'translate'
Contexto: frontend
Pasos: 1. npm run build en unilab_front, 2. Error en login.component.ts línea 13
```

**Agent diagnostica** y propone corrección.

---

## 🔗 Para Consumir Backend Existente

**¿Tienes backend implementado y necesitas frontend que lo consuma?**

Usa skill: **`backend-to-frontend-integration`**

```
Necesito: backend-to-frontend-integration

Módulo: Eventos
Backend: controllers/evento.controller.ts (ya funcional)

Roles:
- Admin: crear, crear jornadas, ver reportes
- Coordinador: ver reportes
- Profesor/Estudiante: listar, inscribirse

UI: [Describe o comparte imagen]
```

**Ventaja:** Analiza backend automáticamente, extrae permisos, genera UI correcta por rol.

---

## 📊 Monitoreo del Progreso

Tras cada skill completado, ve:
- ✅ **Backend compila:** `npm run build` en `unilab_back/`
- ✅ **Frontend compila:** `npm run build` en `unilab_front/`
- ✅ **BD sincronizada:** Prisma migración ejecutada
- ✅ **i18n completado:** Texto no quemado, translations en JSON
- ✅ **Funcionalidad probada:** End-to-end validado

---

## 🎯 Próximos Pasos Recomendados

1. **CRUD Backend:** Tabla nueva importante para tu lógica
2. **CRUD Frontend:** UI para consumir esa tabla
3. **Feature:** Lógica de negocio compleja (ej. "solo profesor puede calificar después de cierta fecha")
4. **Refactor:** Mejorar código existente si es necesario

---

## 💡 Tips Finales

- **Lee el skill completo antes de entrar al chat.** Solo 5 minutos, pero te ahorra preguntas.
- **Sé específico en la entrada.** "Quiero CRUD para X" es vago. "Quiero tabla con campos A, B, C y permiso para rol D" es claro.
- **Confirma SPEC antes de codificar.** El 80% de errores vienen de mala interpretación.
- **Prueba end-to-end.** No es solo "backend compila". ¿Funciona en navegador? ¿Los textos están en español?

---

## 🚦 Estado Actual del Proyecto

✅ **Backend:** Autenticación, usuarios, roles, soft-delete  
✅ **Frontend:** Login, cambio de contraseña, i18n (es/en)  
✅ **BD:** 22 tablas diseñadas, esquema validado  
🔄 **En desarrollo:** Módulos (Proyectos, Semilleros, Eventos)

---

**¿Listo para empezar? Elige un skill arriba, lee su guía en `../skills/[skill]/SKILL.md`, y comienza el SDD en el chat.**

**¡Vamos a construir UniLab! 🚀**
