-- Fase 3 · Perfil tipo CvLAC: datos profesionales, enlaces académicos y formación
ALTER TABLE "usuarios"
  ADD COLUMN "titular" VARCHAR(160),
  ADD COLUMN "biografia" TEXT,
  ADD COLUMN "especialidades" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "fortalezas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "url_cvlac" VARCHAR(500),
  ADD COLUMN "url_orcid" VARCHAR(500),
  ADD COLUMN "url_google_scholar" VARCHAR(500),
  ADD COLUMN "url_researchgate" VARCHAR(500),
  ADD COLUMN "mostrar_telefono" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "perfil_cv_revisado" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "usuario_formacion" (
  "id_formacion" SERIAL NOT NULL,
  "id_usuario" INTEGER NOT NULL,
  "titulo" VARCHAR(255) NOT NULL,
  "institucion" VARCHAR(255) NOT NULL,
  "nivel" VARCHAR(50) NOT NULL,
  "anio_inicio" SMALLINT,
  "anio_fin" SMALLINT,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL,
  "created_by" INTEGER,
  "deleted_at" TIMESTAMP(6),
  CONSTRAINT "usuario_formacion_pkey" PRIMARY KEY ("id_formacion")
);

CREATE INDEX "usuario_formacion_id_usuario_idx" ON "usuario_formacion"("id_usuario");

ALTER TABLE "usuario_formacion"
  ADD CONSTRAINT "usuario_formacion_id_usuario_fkey"
  FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "usuario_formacion"
  ADD CONSTRAINT "usuario_formacion_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
