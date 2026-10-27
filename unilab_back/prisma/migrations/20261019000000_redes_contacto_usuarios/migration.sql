-- HU-1.1: redes de contacto del usuario (LinkedIn, GitHub, portafolio)
ALTER TABLE "usuarios" ADD COLUMN "url_linkedin" VARCHAR(500);
ALTER TABLE "usuarios" ADD COLUMN "url_github" VARCHAR(500);
ALTER TABLE "usuarios" ADD COLUMN "url_portafolio" VARCHAR(500);
