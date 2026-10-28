-- HU-3.2 · Galería de evidencias de semillero
CREATE TABLE "semillero_evidencias" (
  "id_evidencia" SERIAL NOT NULL,
  "id_semillero" INTEGER NOT NULL,
  "ruta_archivo" VARCHAR(500) NOT NULL,
  "nombre_original" VARCHAR(255) NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "orden" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "created_by" INTEGER,
  "deleted_at" TIMESTAMP(6),

  CONSTRAINT "semillero_evidencias_pkey" PRIMARY KEY ("id_evidencia")
);

ALTER TABLE "semillero_evidencias"
  ADD CONSTRAINT "semillero_evidencias_id_semillero_fkey"
  FOREIGN KEY ("id_semillero") REFERENCES "semilleros"("id_semillero") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "semillero_evidencias"
  ADD CONSTRAINT "semillero_evidencias_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "semillero_evidencias_id_semillero_idx" ON "semillero_evidencias"("id_semillero");
