# 📖 UniLab SDD — Índice Central

**Bienvenido al sistema de desarrollo coordinado (SDD) de UniLab.**

Este es tu **punto de entrada único** para entender y usar el framework de desarrollo.

---

## 🎯 Si Tienes Prisa (2 minutos)

1. Lee: **[QUICK_START.md](./QUICK_START.md)** — guía rápida con ejemplo
2. Elige un skill de la tabla en QUICK_START
3. Escribe en el chat siguiendo el formato sugerido
4. El agent construye → compila → valida

---

## 📚 Estructura Completa

### 1. **[ROUTER.md](./ROUTER.md)** — La Brújula
Tu **navegador principal** de flujos. Define 8 skills coordinados:
- `backend-crud` — Tabla + operaciones CRUD simples
- `frontend-crud` — UI para consumir backend
- `backend-feature` — Lógica de negocio compleja
- `frontend-feature` — UI compleja multi-paso
- `auth-flow` — Autenticación y autorización
- `i18n-feature` — Internacionalización
- `debug-fix` — Resolver errores
- `refactor` — Mejorar código

**Lee esto cuando:** Necesitas recordar cuál skill usar.

---

### 3. **[DOCUMENTACION.md](./DOCUMENTACION.md)** — Documentación Integrada

**DOCUMENTACIÓN ES PARTE DEL SDD.** No es opcional.

Define cómo documentar Swagger + Postman para CADA funcionalidad:
- Estructura OpenAPI (paths, schemas, tags)
- Estructura Postman (requests, variables, ejemplos)
- Checklist de documentación obligatorio
- Pasos integrados en cada skill

**Ref:** Cada skill incluye "Paso N: Documentar Swagger + Postman"

**Lee esto cuando:** Implementas un backend-crud, auth-flow o cualquier funcionalidad nueva.

---

### 4. **Carpeta `/skills/`** — Recetas Paso a Paso

Cada skill es un archivo `.md` con proceso SDD completo:
- **Cuándo usarlo** — criterios de entrada
- **Entrada conversacional** — formato esperado en el chat
- **Proceso SDD** — especificación → confirmación → implementación
- **Checklist de salida** — qué debe estar listo
- **Ejemplos y tips** — código de referencia

**Archivos:**
- `[backend-crud.md](../skills/backend-crud/SKILL.md)`
- `[frontend-crud.md](../skills/frontend-crud/SKILL.md)`
- `[auth-flow.md](../skills/auth-flow/SKILL.md)`
- (otros skills similar)

**Lee esto cuando:** Quieras profundizar en UN skill específico.

---

### 3. **[QUICK_START.md](./QUICK_START.md)** — Guía Rápida
- Tabla de skills (qué, para qué, ejemplo)
- Ejemplos de conversación en el chat
- Ejemplo completo end-to-end (5 minutos)
- Referencia de reglas transversales
- Solución de problemas

**Lee esto cuando:** Seas principiante o necesites recordar el flujo.

---

### 4. **Instrucciones Específicas**

- **[unilab-global.mdc](../rules/unilab-global.mdc)** — Contexto global del proyecto, SDD, reglas no negociables
- **[backend.mdc](../rules/backend.mdc)** — Stack, patrones, convenciones backend
- **[frontend.mdc](../rules/frontend.mdc)** — Stack, patrones, convenciones frontend

**Ref ácil** cuando necesites verificar: "¿Cómo se valida con Zod?" o "¿Signals o RxJS?"

---

### 5. **Documentación del Modelo**

En la **raíz del proyecto**:
- **`00-esquema-bd-referencia.md`** — Modelo de BD completo (22 tablas), roles, JWT, políticas de soft-delete, autenticación
- **`01-prompt-maestro-backend.md`** — Contexto histórico y referencia (opcional)

**LA FUENTE DE VERDAD** para preguntas sobre: qué campos existe en tabla X, relaciones, permisos, etc.

---

## 🔄 Flujo Típico de Trabajo

```
1. Tienes idea: "Necesito agregar calificaciones a proyectos"
   ↓
2. Lees QUICK_START.md (2 min) → identifies skill = backend-crud
   ↓
3. Lees ../skills/backend-crud/SKILL.md (5 min) → entiendes el proceso
   ↓
4. En chat: "Necesito: backend-crud ... [details]"
   ↓
5. Agent presenta SPEC → confirmas ✅
   ↓
6. Agent codifica (5-15 min) → compila → valida
   ↓
7. Chat 2: "Necesito: backend-to-frontend-integration ... [details]"
   ↓
8. Agent analiza backend → genera frontend por rol → compila → valida
   ↓
9. ✅ FUNCIONALIDAD LISTA (backend + frontend integrados)

---

## 📋 Checklist de Contexto (Para Entender el Proyecto)

**Antes de empezar a desarrollar, asegúrate que sabes:**

- [ ] **5 Roles:** Administrador, Coordinador, Profesor, Estudiante, Externo (fijos)
- [ ] **Soft-delete:** Nunca borrado físico. `DELETE` → `UPDATE deleted_at = NOW()`
- [ ] **primer_login:** Si `true`, usuario bloqueado a `/auth/cambiar-password`
- [ ] **JWT:** Contiene `id_usuario`, `id_rol`, `email` (no datos contextuales)
- [ ] **Backend:** Node.js + Express + Prisma + PostgreSQL + Zod
- [ ] **Frontend:** Angular 17+ standalone + Signals + i18n
- [ ] **SDD obligatorio:** SPEC → Confirmación → Implementación

Lee `00-esquema-bd-referencia.md` si necesitas aclaraciones.

---

## 🎨 Conceptos Clave del SDD

### 1. **Spec First**
Antes de cualquier línea de código:
- Define qué entrada, qué proceso, qué salida
- Valida permiso por rol
- Identifica validaciones de negocio
- Listas casos límite

### 2. **Conversacional, No Documental**
- TODO en el chat
- Sin `.md` de análisis o reportes
- Comunicación directa y concisa

### 3. **Modularidad**
- Una funcionalidad a la vez
- Backend completo ANTES que frontend
- No mezcles módulos en un mismo cambio

### 4. **Consistencia**
- Busca similares antes de crear nuevo
- Reutiliza patterns existentes
- Sigue convenciones ya establecidas

### 5. **Calidad**
- Compilar sin errores (backend + frontend)
- Soft-delete en TODA operación de borrado
- i18n en 100% del texto visible
- Permisos verificados por rol

---

## ⚡ Ejemplos Rápidos

### Ejemplo 1: "Necesito tabla nueva"
```
Necesito: backend-crud
[Describe campos, roles, validaciones]
```
→ Agent crea: schema.prisma + repository + service + controller + routes + swagger

### Ejemplo 2: "Necesito interfaz para consumir backend"
```
Necesito: frontend-crud
[Describe campos a mostrar/editar, permisos]
```
→ Agent crea: service + componente listado + componente formulario + i18n

### Ejemplo 3: "Necesito flujo con lógica compleja"
```
Necesito: backend-feature
[Describe flujo de usuario, validaciones, cascadas]
```
→ Agent diseña lógica en service, integra permisos, valida

### Ejemplo 4: "Error: login retorna 401"
```
Necesito: debug-fix
Síntoma: [detalles]
Pasos: [cómo reproducir]
```
→ Agent diagnostica, propone raíz, arregla

---

## 🚦 Roadmap de Funcionalidades Sugeridas

1. ✅ **Usuarios & Auth** — Ya hecho
2. ⏳ **Proyectos** — CRUD backend + frontend
3. ⏳ **Semilleros** — CRUD + flujo de publicación
4. ⏳ **Eventos** — CRUD + asistencia QR
5. ⏳ **Reportes** — Analytics y dashboards

---

## 💬 Preguntas Frecuentes

**P: ¿Y si no tengo seguro cuál skill usar?**  
R: Lee QUICK_START.md, tabla de skills. Elige el más parecido. El agent ajusta si es necesario.

**P: ¿Puedo saltarme la SPEC y empezar a codificar?**  
R: No. SDD = SPEC primero. El agent te pedirá confirmación antes de codificar.

**P: ¿Qué pasa si el backend cambia?**  
R: Usa `backend-feature` para cambios complejos, o `debug-fix` para errores.

**P: ¿Cómo agrego traducción a nuevo componente?**  
R: Usa `i18n-feature` skill. Agrega claves a es.json y en.json, templates usan `| translate`.

**P: ¿Backend + Frontend se hacen juntos?**  
R: No. Backend PRIMERO (debe estar deployable). Luego frontend (consume backend). Esto evita inconsistencias.

---

## 🔗 Relación Entre Documentos

```
INDEX.md (aquí)
  ├─ QUICK_START.md (entrada para principiantes)
  ├─ ROUTER.md (selector de skills)
  ├─ skills/ (detalles paso-a-paso)
  │   ├─ backend-crud.md
  │   ├─ frontend-crud.md
  │   ├─ auth-flow.md
  │   └─ [más skills]
  ├─ ../rules/unilab-global.mdc (contexto global)
  ├─ ../rules/ (patrones específicos)
  │   ├─ backend.mdc
  │   └─ frontend.mdc
  └─ ../00-esquema-bd-referencia.md (modelo BD canónico)
```

---

## 🎓 Tu Primer Proyecto: Paso a Paso

1. **Elige una funcionalidad pequeña**  
   Ej: "Agregar tabla de Calificaciones"

2. **Lee QUICK_START.md** (2 min)  
   Identifica que es `backend-crud`

3. **Lee ../skills/backend-crud/SKILL.md** (5 min)  
   Entiende el proceso

4. **En el chat:**
   ```
   Necesito: backend-crud
   
   Agregar tabla Calificación:
   - puntos: 0-100
   - comentario: texto
   - FK: Proyecto, Usuario
   
   Profesor crea/edita, Estudiante solo ve.
   ```

5. **Agent presenta SPEC** → Confirma ✅

6. **Agent codifica** → Compila ✅

7. **Chat 2: Frontend**
   ```
   Necesito: frontend-crud
   [describe UI]
   ```

8. **Agent construye** → Compila ✅

9. **¡Listo!** Tienes funcionalidad end-to-end.

---

## 🚀 Inicio Rápido (Ahora)

**Opción A: Aprende (5 min)**
1. Lee QUICK_START.md
2. Lee ../skills/backend-crud/SKILL.md (o el skill que interese)
3. Entiende el flujo SDD

**Opción B: Empieza Ahora (< 1 min)**
1. Tienes una idea
2. Va al chat: "Necesito: [skill] ... [detalles]"
3. Agent guía todo

---

## 📞 Soporte

Si algo no está claro:
1. Lee el skill completo
2. Si persiste, pregunta en el chat: "¿Cómo se...?"
3. Agent explica + ajusta si es necesario

---

**¿Listo? Elige tu camino:**
- 🎓 **Aprende:** Lee QUICK_START.md → skills/
- ⚡ **Actúa:** Abre el chat y empieza el SDD

**¡Vamos a construir UniLab! 🚀**

---

*Última actualización: 2025-07-12*  
*Sistema SDD coordinado para Cursor y desarrollo manual.*
