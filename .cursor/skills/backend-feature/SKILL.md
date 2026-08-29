---
name: backend-feature
description: Implementa lógica de negocio compleja en backend existente (flujos multi-actores, cambios de reglas, endpoints públicos, transacciones). Usar cuando la tabla ya existe y el cambio es de reglas de dominio, no CRUD simple.
---

# Skill: Backend Feature (Lógica de Negocio)

## Descripción
Cambiar o ampliar **reglas de negocio** en módulos backend ya existentes: flujos con varios actores, endpoints públicos vs autenticados, validaciones en cascada, cambios de modelo sin tabla nueva.

**Incluye:** Análisis regla vieja → regla nueva → Service → Routes → Zod → Swagger → Postman → regresión de flujos autenticados

---

## Cuándo Usarlo

✅ **Usar si:**
- Cambia una regla de negocio (ej. inscripción sin cuenta)
- Requiere endpoints nuevos en módulo existente
- Tabla existe pero cambian campos opcionales o índices únicos
- Dual path: visitante sin auth + usuario autenticado

❌ **NO usar si:**
- Tabla nueva + CRUD básico → `backend-crud`
- Solo bug → `debug-fix`
- Solo UI → `frontend-feature`

---

## Entrada Conversacional

```
Necesito: backend-feature

Módulo: [NOMBRE]
Regla anterior: [DESCRIPCIÓN]
Regla nueva: [DESCRIPCIÓN]
Actores: [roles / visitante sin cuenta]
¿Cambia BD?: [sí/no — detalle]
Validaciones: [lista]
Casos límite: [lista]
Endpoints nuevos o modificados: [lista]
```

---

## Proceso SDD

### 1️⃣ SPEC (1 párrafo)
- Regla vieja vs nueva
- Actores y permisos por endpoint
- Cambios en BD (preguntar antes de `schema.prisma`)
- Casos límite y códigos HTTP esperados
- Qué flujos autenticados deben seguir igual

### 2️⃣ CONFIRMACIÓN
Usuario confirma SPEC. Una pregunta si hay ambigüedad.

### 3️⃣ IMPLEMENTACIÓN

1. **Modelo** — migration Prisma si aplica; `prisma generate`
2. **Repository** — queries nuevas; no lógica de negocio
3. **Service** — reglas de dominio; `AppError` con código correcto
4. **Routes** — `verifyToken` solo donde la regla exige auth; rutas públicas bajo `/public` si visitantes
5. **Zod** — schemas en `schemas/index.ts`
6. **Swagger** — `paths.ts` + `components.ts`; `security: []` en públicos
7. **Postman** — actualizar colección
8. **Regresión** — verificar endpoints autenticados existentes

### 4️⃣ CHECKLIST SALIDA

- [ ] `tsc --noEmit` sin errores
- [ ] Migration aplicada
- [ ] Swagger documentado
- [ ] Flujo autenticado anterior intacto
- [ ] Soft-delete respetado
- [ ] Casos límite cubiertos en service

---

## Patrones UniLab

- Rutas públicas: `src/routes/publico.routes.ts` + `publicoService`
- Dual path en service: método autenticado + método público compartiendo validación interna
- Índices únicos parciales: `WHERE deleted_at IS NULL`
- Preguntar antes de modificar `schema.prisma` (regla global)
