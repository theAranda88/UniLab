-- Alcance del evento: institucional, de una escuela, de un semillero o externo (solicitado por un usuario Externo)
ALTER TABLE "eventos"
  ADD COLUMN "alcance" VARCHAR(20) NOT NULL DEFAULT 'institucional',
  ADD COLUMN "id_escuela" INTEGER,
  ADD COLUMN "id_semillero" INTEGER,
  ADD COLUMN "organizacion_externa" VARCHAR(255),
  ADD COLUMN "motivo_rechazo" TEXT;

ALTER TABLE "eventos"
  ADD CONSTRAINT "eventos_id_escuela_fkey"
  FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eventos"
  ADD CONSTRAINT "eventos_id_semillero_fkey"
  FOREIGN KEY ("id_semillero") REFERENCES "semilleros"("id_semillero") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "eventos"
  ADD CONSTRAINT "eventos_alcance_chk"
  CHECK ("alcance" IN ('institucional', 'escuela', 'semillero', 'externo'));
