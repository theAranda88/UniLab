-- Roles dentro del semillero: profesores (líder, coordinador, acompañante) y estudiantes
ALTER TABLE "semillero_profesores" ADD COLUMN "rol" VARCHAR(30) NOT NULL DEFAULT 'acompanante';
UPDATE "semillero_profesores" SET "rol" = 'lider' WHERE "es_lider" = true;
ALTER TABLE "semillero_profesores"
  ADD CONSTRAINT "semillero_profesores_rol_check" CHECK ("rol" IN ('lider', 'coordinador', 'acompanante'));

ALTER TABLE "semillero_miembros" ADD COLUMN "rol" VARCHAR(30) NOT NULL DEFAULT 'integrante';
ALTER TABLE "semillero_miembros"
  ADD CONSTRAINT "semillero_miembros_rol_check" CHECK ("rol" IN ('integrante', 'lider', 'coordinador'));
