---
name: frontend-feature
description: UI y flujos frontend complejos (multi-paso, público sin login, estados derivados, integración con API pública). Usar cuando el cambio es de experiencia de usuario y lógica de pantalla, no CRUD simple.
---

# Skill: Frontend Feature (UI Compleja)

## Descripción
Implementar **flujos de usuario** que no son un CRUD de listado/formulario: pasos condicionales, rutas públicas, identificación sin sesión, estados en Signals, integración dual (API auth + API pública).

---

## Cuándo Usarlo

✅ **Usar si:**
- Flujo multi-paso (inscripción → QR → documento)
- Rutas sin `authGuard`
- Misma pantalla con modo autenticado vs visitante
- Estados UI derivados (`computed`) de varias fuentes

❌ **NO usar si:**
- Listado + formulario simple → `frontend-crud`
- Backend no listo → primero `backend-feature`
- Solo traducciones → `i18n-feature`

---

## Entrada Conversacional

```
Necesito: frontend-feature

Módulo: [NOMBRE]
Flujo del usuario: [pasos 1, 2, 3...]
Modo visitante: [qué ve sin login]
Modo autenticado: [qué cambia con sesión]
Validaciones UI: [lista]
Rutas: [paths]
API: [endpoints públicos y autenticados]
```

---

## Proceso SDD

### 1️⃣ SPEC
- Pasos del usuario (visitante vs autenticado)
- Rutas y guards
- Servicios HTTP a consumir
- Textos i18n necesarios
- Persistencia local si aplica (`sessionStorage`)

### 2️⃣ CONFIRMACIÓN
Usuario confirma antes de codificar.

### 3️⃣ IMPLEMENTACIÓN

1. **Modelos** — `core/models/` alineados con backend
2. **Servicio** — `PublicPortalService` o feature service; sin URLs fuera del service
3. **Rutas** — `app.routes.ts`; quitar guards solo donde la SPEC lo indica
4. **Componentes** — standalone, Signals, `@if`/`@for`
5. **i18n** — `es.json` y `en.json`
6. **Build** — `ng build` sin errores

### 4️⃣ CHECKLIST SALIDA

- [ ] Sin textos hardcodeados
- [ ] Visitante no accede a rutas delegadas de otros roles
- [ ] Usuario autenticado mantiene flujo previo
- [ ] Errores del backend mostrados al usuario
- [ ] Mobile-first si el flujo incluye QR

---

## Patrones UniLab

- Portal Codex: `portalTheme`, `portal-shell`
- Documento visitante: util compartido en `core/utils/`
- `@Input() modoPublico` en formularios compartidos
- `auth.isAuthenticated()` para bifurcar API
