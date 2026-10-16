-- RA-013: parámetros del sistema editables por el administrador sin redesplegar
CREATE TABLE "configuracion_sistema" (
    "clave" VARCHAR(100) NOT NULL,
    "valor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("clave")
);

ALTER TABLE "configuracion_sistema"
  ADD CONSTRAINT "configuracion_sistema_updated_by_fkey"
  FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id_usuario")
  ON DELETE RESTRICT ON UPDATE CASCADE;
