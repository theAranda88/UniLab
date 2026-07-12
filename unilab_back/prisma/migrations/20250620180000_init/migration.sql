-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "nombres" VARCHAR(255) NOT NULL,
    "apellidos" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "documento_identidad" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "primer_login" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "perfiles_coordinador" (
    "id_usuario" INTEGER NOT NULL,
    "cargo" VARCHAR(255) NOT NULL,
    "dependencia" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "perfiles_coordinador_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "perfiles_profesor" (
    "id_usuario" INTEGER NOT NULL,
    "codigo_docente" VARCHAR(255) NOT NULL,
    "id_escuela" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "perfiles_profesor_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "perfiles_estudiante" (
    "id_usuario" INTEGER NOT NULL,
    "codigo_estudiantil" VARCHAR(255) NOT NULL,
    "id_escuela" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "perfiles_estudiante_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "perfiles_externo" (
    "id_usuario" INTEGER NOT NULL,
    "institucion" VARCHAR(255) NOT NULL,
    "ocupacion" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "perfiles_externo_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "escuelas" (
    "id_escuela" SERIAL NOT NULL,
    "nombre_escuela" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "escuelas_pkey" PRIMARY KEY ("id_escuela")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id_curso" SERIAL NOT NULL,
    "id_escuela" INTEGER NOT NULL,
    "nombre_curso" VARCHAR(255) NOT NULL,
    "periodo_academico" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "curso_autorizaciones" (
    "id_autorizacion" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "id_profesor_autorizador" INTEGER NOT NULL,
    "autorizado" BOOLEAN NOT NULL DEFAULT true,
    "fecha_autorizacion" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "curso_autorizaciones_pkey" PRIMARY KEY ("id_autorizacion")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id_proyecto" SERIAL NOT NULL,
    "id_curso" INTEGER NOT NULL,
    "id_semillero" INTEGER,
    "id_estudiante_creador" INTEGER NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_proyecto" VARCHAR(50) NOT NULL,
    "url_aplicativo" VARCHAR(500) NOT NULL,
    "url_apk" VARCHAR(500),
    "url_youtube" VARCHAR(500),
    "url_spotify" VARCHAR(500),
    "contador_vistas" INTEGER NOT NULL DEFAULT 0,
    "estado_proyecto" VARCHAR(50) NOT NULL,
    "id_aprobador" INTEGER,
    "fecha_publicacion" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id_proyecto")
);

-- CreateTable
CREATE TABLE "proyecto_coordinadores" (
    "id_proyecto" INTEGER NOT NULL,
    "id_profesor" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "proyecto_coordinadores_pkey" PRIMARY KEY ("id_proyecto","id_profesor")
);

-- CreateTable
CREATE TABLE "proyecto_autores" (
    "id_proyecto" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "rol_autor" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "proyecto_autores_pkey" PRIMARY KEY ("id_proyecto","id_estudiante")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id_calificacion" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "puntuacion" SMALLINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id_calificacion")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id_comentario" SERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_comentario_padre" INTEGER,
    "contenido" TEXT NOT NULL,
    "fecha_comentario" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "proyecto_vistas" (
    "id_vista" BIGSERIAL NOT NULL,
    "id_proyecto" INTEGER NOT NULL,
    "id_usuario" INTEGER,
    "fecha_hora_visita" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "proyecto_vistas_pkey" PRIMARY KEY ("id_vista")
);

-- CreateTable
CREATE TABLE "semilleros" (
    "id_semillero" SERIAL NOT NULL,
    "nombre_semillero" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "id_escuela" INTEGER NOT NULL,
    "id_profesor_lider" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "semilleros_pkey" PRIMARY KEY ("id_semillero")
);

-- CreateTable
CREATE TABLE "semillero_profesores" (
    "id_semillero" INTEGER NOT NULL,
    "id_profesor" INTEGER NOT NULL,
    "es_lider" BOOLEAN NOT NULL DEFAULT false,
    "fecha_asignacion" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "semillero_profesores_pkey" PRIMARY KEY ("id_semillero","id_profesor")
);

-- CreateTable
CREATE TABLE "semillero_miembros" (
    "id_membresia" SERIAL NOT NULL,
    "id_semillero" INTEGER NOT NULL,
    "id_estudiante" INTEGER NOT NULL,
    "estado_solicitud" VARCHAR(50) NOT NULL,
    "fecha_resolucion" TIMESTAMP(6),
    "puede_publicar" BOOLEAN NOT NULL DEFAULT false,
    "fecha_autorizacion" TIMESTAMP(6),
    "id_profesor_autorizador" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "semillero_miembros_pkey" PRIMARY KEY ("id_membresia")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id_evento" SERIAL NOT NULL,
    "nombre_evento" VARCHAR(255) NOT NULL,
    "tipo_evento" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "lugar" VARCHAR(255) NOT NULL,
    "id_organizador" INTEGER NOT NULL,
    "estado" VARCHAR(50) NOT NULL,
    "requiere_pago" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "evento_jornadas" (
    "id_jornada" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "nombre_jornada" VARCHAR(255) NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "codigo_qr" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "evento_jornadas_pkey" PRIMARY KEY ("id_jornada")
);

-- CreateTable
CREATE TABLE "inscripciones" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo_asistente" VARCHAR(50) NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "documento_identidad" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(255) NOT NULL,
    "institucion" VARCHAR(255),
    "genero" VARCHAR(50) NOT NULL,
    "estado_pago" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id_inscripcion")
);

-- CreateTable
CREATE TABLE "asistencias" (
    "id_asistencia" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "id_jornada" INTEGER NOT NULL,
    "fecha_hora_registro" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "created_by" INTEGER,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id_asistencia")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "curso_autorizaciones_id_curso_id_estudiante_key" ON "curso_autorizaciones"("id_curso", "id_estudiante") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_id_proyecto_id_usuario_key" ON "calificaciones"("id_proyecto", "id_usuario") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "semillero_miembros_id_semillero_id_estudiante_key" ON "semillero_miembros"("id_semillero", "id_estudiante") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "evento_jornadas_codigo_qr_key" ON "evento_jornadas"("codigo_qr");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_id_evento_id_usuario_key" ON "inscripciones"("id_evento", "id_usuario") WHERE ("deleted_at" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_id_inscripcion_id_jornada_key" ON "asistencias"("id_inscripcion", "id_jornada") WHERE ("deleted_at" IS NULL);

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_coordinador" ADD CONSTRAINT "perfiles_coordinador_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_coordinador" ADD CONSTRAINT "perfiles_coordinador_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_profesor" ADD CONSTRAINT "perfiles_profesor_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_profesor" ADD CONSTRAINT "perfiles_profesor_id_escuela_fkey" FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_profesor" ADD CONSTRAINT "perfiles_profesor_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_id_escuela_fkey" FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_estudiante" ADD CONSTRAINT "perfiles_estudiante_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_externo" ADD CONSTRAINT "perfiles_externo_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfiles_externo" ADD CONSTRAINT "perfiles_externo_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escuelas" ADD CONSTRAINT "escuelas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_id_escuela_fkey" FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_autorizaciones" ADD CONSTRAINT "curso_autorizaciones_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_autorizaciones" ADD CONSTRAINT "curso_autorizaciones_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_autorizaciones" ADD CONSTRAINT "curso_autorizaciones_id_profesor_autorizador_fkey" FOREIGN KEY ("id_profesor_autorizador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curso_autorizaciones" ADD CONSTRAINT "curso_autorizaciones_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "cursos"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_id_semillero_fkey" FOREIGN KEY ("id_semillero") REFERENCES "semilleros"("id_semillero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_id_estudiante_creador_fkey" FOREIGN KEY ("id_estudiante_creador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_id_aprobador_fkey" FOREIGN KEY ("id_aprobador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_coordinadores" ADD CONSTRAINT "proyecto_coordinadores_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_coordinadores" ADD CONSTRAINT "proyecto_coordinadores_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_coordinadores" ADD CONSTRAINT "proyecto_coordinadores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_autores" ADD CONSTRAINT "proyecto_autores_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_autores" ADD CONSTRAINT "proyecto_autores_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_autores" ADD CONSTRAINT "proyecto_autores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_id_comentario_padre_fkey" FOREIGN KEY ("id_comentario_padre") REFERENCES "comentarios"("id_comentario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_vistas" ADD CONSTRAINT "proyecto_vistas_id_proyecto_fkey" FOREIGN KEY ("id_proyecto") REFERENCES "proyectos"("id_proyecto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_vistas" ADD CONSTRAINT "proyecto_vistas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyecto_vistas" ADD CONSTRAINT "proyecto_vistas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_id_escuela_fkey" FOREIGN KEY ("id_escuela") REFERENCES "escuelas"("id_escuela") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_id_profesor_lider_fkey" FOREIGN KEY ("id_profesor_lider") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_profesores" ADD CONSTRAINT "semillero_profesores_id_semillero_fkey" FOREIGN KEY ("id_semillero") REFERENCES "semilleros"("id_semillero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_profesores" ADD CONSTRAINT "semillero_profesores_id_profesor_fkey" FOREIGN KEY ("id_profesor") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_profesores" ADD CONSTRAINT "semillero_profesores_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_miembros" ADD CONSTRAINT "semillero_miembros_id_semillero_fkey" FOREIGN KEY ("id_semillero") REFERENCES "semilleros"("id_semillero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_miembros" ADD CONSTRAINT "semillero_miembros_id_estudiante_fkey" FOREIGN KEY ("id_estudiante") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_miembros" ADD CONSTRAINT "semillero_miembros_id_profesor_autorizador_fkey" FOREIGN KEY ("id_profesor_autorizador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semillero_miembros" ADD CONSTRAINT "semillero_miembros_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_id_organizador_fkey" FOREIGN KEY ("id_organizador") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_jornadas" ADD CONSTRAINT "evento_jornadas_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento_jornadas" ADD CONSTRAINT "evento_jornadas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_id_jornada_fkey" FOREIGN KEY ("id_jornada") REFERENCES "evento_jornadas"("id_jornada") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_puntuacion_check" CHECK ("puntuacion" >= 1 AND "puntuacion" <= 5);
