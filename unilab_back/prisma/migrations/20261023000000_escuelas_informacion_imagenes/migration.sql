-- HU-2.1: información completa de la escuela (descripción, color, ícono y encargado)
ALTER TABLE "escuelas" ADD COLUMN "descripcion" TEXT;
ALTER TABLE "escuelas" ADD COLUMN "color" VARCHAR(7);
ALTER TABLE "escuelas" ADD COLUMN "icono" VARCHAR(100);
ALTER TABLE "escuelas" ADD COLUMN "id_encargado" INTEGER;

-- AddForeignKey
ALTER TABLE "escuelas" ADD CONSTRAINT "escuelas_id_encargado_fkey" FOREIGN KEY ("id_encargado") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- HU-2.1 / HU-2.2: imágenes de la escuela
-- CreateTable
CREATE TABLE "escuela_imagenes" (
    "id_imagen" SERIAL NOT NULL,
    "id_escuela" INTEGER NOT NULL,
    "ruta_archivo" VARCHAR(500) NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "orden" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "escuela_imagenes_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateIndex
CREATE UNIQUE INDEX "escuela_imagenes_id_escuela_orden_key" ON "escuela_imagenes"("id_escuela", "orden") WHERE "deleted_at" IS NULL;

-- AddForeignKey
ALTER TABLE "escuela_imagenes" ADD CONSTRAINT "escuela_imagenes_id_escuela_fkey" FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escuela_imagenes" ADD CONSTRAINT "escuela_imagenes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
