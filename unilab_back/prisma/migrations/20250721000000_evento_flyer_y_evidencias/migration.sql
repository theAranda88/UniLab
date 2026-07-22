-- Flyer opcional del evento
ALTER TABLE "eventos" ADD COLUMN "flyer_ruta_archivo" VARCHAR(500);
ALTER TABLE "eventos" ADD COLUMN "url_flyer" VARCHAR(500);

-- Evidencias fotográficas por jornada (máx. 3 en aplicación)
CREATE TABLE "evento_jornada_evidencias" (
    "id_evidencia" SERIAL NOT NULL,
    "id_jornada" INTEGER NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "evento_jornada_evidencias_pkey" PRIMARY KEY ("id_evidencia")
);

ALTER TABLE "evento_jornada_evidencias" ADD CONSTRAINT "evento_jornada_evidencias_id_jornada_fkey" FOREIGN KEY ("id_jornada") REFERENCES "evento_jornadas"("id_jornada") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "evento_jornada_evidencias" ADD CONSTRAINT "evento_jornada_evidencias_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
