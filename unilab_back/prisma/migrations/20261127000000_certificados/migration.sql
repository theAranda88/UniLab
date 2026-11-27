-- Firma del usuario para los certificados
ALTER TABLE "usuarios" ADD COLUMN "firma_ruta" VARCHAR(500);

-- Certificados de asistencia a eventos
CREATE TABLE "certificados" (
    "id_certificado" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "codigo_verificacion" VARCHAR(64) NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "documento_identidad" VARCHAR(255) NOT NULL,
    "nombre_evento" VARCHAR(255) NOT NULL,
    "jornadas_asistidas" INTEGER NOT NULL,
    "jornadas_totales" INTEGER NOT NULL,
    "porcentaje_asistencia" INTEGER NOT NULL,
    "fecha_emision" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id_certificado")
);

CREATE UNIQUE INDEX "certificados_codigo_verificacion_key" ON "certificados"("codigo_verificacion");
CREATE UNIQUE INDEX "certificados_id_inscripcion_key" ON "certificados"("id_inscripcion") WHERE ("deleted_at" IS NULL);

ALTER TABLE "certificados" ADD CONSTRAINT "certificados_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
