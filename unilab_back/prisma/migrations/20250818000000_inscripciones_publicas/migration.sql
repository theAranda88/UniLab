-- Inscripciones públicas: visitantes sin cuenta (id_usuario opcional)
ALTER TABLE "inscripciones" ALTER COLUMN "id_usuario" DROP NOT NULL;

CREATE UNIQUE INDEX "inscripciones_id_evento_documento_identidad_key"
  ON "inscripciones"("id_evento", "documento_identidad")
  WHERE ("deleted_at" IS NULL);
