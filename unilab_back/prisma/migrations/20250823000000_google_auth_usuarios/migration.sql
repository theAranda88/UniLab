-- Google Sign-In: vínculo OAuth y perfil pendiente tras auto-registro
ALTER TABLE "usuarios" ADD COLUMN "google_sub" VARCHAR(255);
ALTER TABLE "usuarios" ADD COLUMN "perfil_pendiente" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "usuarios_google_sub_unique" ON "usuarios"("google_sub") WHERE "deleted_at" IS NULL AND "google_sub" IS NOT NULL;
