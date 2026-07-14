-- CreateTable
CREATE TABLE "proyecto_imagenes" (
    "id_imagen" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "proyecto_imagenes_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateIndex
CREATE UNIQUE INDEX "proyecto_imagenes_id_proyecto_orden_key" ON "proyecto_imagenes"("id_proyecto", "orden") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "proyecto_imagenes" ADD CONSTRAINT "proyecto_imagenes_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_imagenes" ADD CONSTRAINT "proyecto_imagenes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
