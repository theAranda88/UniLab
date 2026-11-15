-- Fase 1 · Un estudiante puede pertenecer a máximo 2 escuelas (principal + secundaria)
ALTER TABLE "perfiles_estudiante" ADD COLUMN "id_escuela_secundaria" INTEGER;

ALTER TABLE "perfiles_estudiante"
  ADD CONSTRAINT "perfiles_estudiante_id_escuela_secundaria_fkey"
  FOREIGN KEY ("id_escuela_secundaria") REFERENCES "escuelas"("id_escuela")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "perfiles_estudiante"
  ADD CONSTRAINT "perfiles_estudiante_escuelas_distintas_chk"
  CHECK ("id_escuela_secundaria" IS NULL OR "id_escuela_secundaria" <> "id_escuela");
