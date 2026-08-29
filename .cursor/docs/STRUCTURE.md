# Estructura `.cursor/` — Referencia Visual

Sistema SDD coordinado de UniLab adaptado para Cursor.

```
.cursor/
├── rules/                              ← Reglas persistentes del agente (.mdc)
│   ├── unilab-global.mdc               ← Contexto global (alwaysApply)
│   ├── unilab-sdd.mdc                  ← Invocación de skills (alwaysApply)
│   ├── backend.mdc                     ← Patrones backend (globs: unilab_back/**)
│   └── frontend.mdc                    ← Patrones frontend (globs: unilab_front/**)
│
├── skills/                             ← Recetas SDD paso a paso
│   ├── backend-crud/SKILL.md
│   ├── frontend-crud/SKILL.md
│   ├── backend-to-frontend-integration/SKILL.md
│   └── auth-flow/SKILL.md
│
└── docs/                               ← Navegación y referencia SDD
    ├── INDEX.md                        ← Punto de entrada
    ├── QUICK_START.md                  ← Guía rápida (2 min)
    ├── ROUTER.md                       ← Selector de skills
    ├── STRUCTURE.md                    ← Este archivo
    └── DOCUMENTACION.md                ← Swagger + Postman obligatorio

AGENTS.md                               ← Guía del agente (raíz del proyecto)
```

---

## Qué leer según necesidad

| Necesidad | Archivo | Tiempo |
|-----------|---------|--------|
| Soy nuevo | `QUICK_START.md` | 2 min |
| Ver todas las opciones | `ROUTER.md` | 5 min |
| Crear tabla backend | `../skills/backend-crud/SKILL.md` | 10 min |
| UI para esa tabla | `../skills/frontend-crud/SKILL.md` | 10 min |
| Patrones backend | `../rules/backend.mdc` | 15 min |
| Patrones frontend | `../rules/frontend.mdc` | 15 min |
| Índice completo | `INDEX.md` | 10 min |

---

## Skills disponibles

| # | Skill | Estado | Link |
|---|-------|--------|------|
| 1 | `backend-crud` | ✅ | [SKILL.md](../skills/backend-crud/SKILL.md) |
| 2 | `frontend-crud` | ✅ | [SKILL.md](../skills/frontend-crud/SKILL.md) |
| 3 | `backend-to-frontend-integration` | ✅ | [SKILL.md](../skills/backend-to-frontend-integration/SKILL.md) |
| 4 | `auth-flow` | ✅ | [SKILL.md](../skills/auth-flow/SKILL.md) |
| 5 | `backend-feature` | ⏳ Planeado | — |
| 6 | `frontend-feature` | ⏳ Planeado | — |
| 7 | `i18n-feature` | ⏳ Planeado | — |
| 8 | `debug-fix` | ⏳ Planeado | — |
| 9 | `refactor` | ⏳ Planeado | — |

---

## Cómo invocar un skill en Cursor

```
Necesito: backend-crud

Agregar tabla Calificación con campos: puntos (0-100), comentario, FK proyecto.
Roles: Profesor crea/edita, Estudiante solo ve.
```

El agente lee `.cursor/skills/backend-crud/SKILL.md` y sigue el proceso SDD.

---

## Referencias externas (raíz del proyecto)

- `00-esquema-bd-referencia.md` — Modelo de BD canónico
- `01-prompt-maestro-backend.md` — Contexto histórico

---

*Sistema SDD para Cursor. Última actualización: 2026-07-13*
