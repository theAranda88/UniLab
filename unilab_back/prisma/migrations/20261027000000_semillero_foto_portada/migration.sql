-- HU-3.1 · Portada de semillero
ALTER TABLE "semilleros"
  ADD COLUMN "foto_portada_ruta" VARCHAR(500),
  ADD COLUMN "url_foto_portada" VARCHAR(500);
