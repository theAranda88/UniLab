/**
 * SEED DE DATOS DE PRUEBA — UniLab
 *
 * Contraseña para TODOS los usuarios sembrados: Password123!
 *
 * | Rol           | Email                    |
 * |---------------|--------------------------|
 * | Administrador | admin@unilab.edu         |
 * | Coordinador   | coordinador@unilab.edu   |
 * | Profesor      | profesor1@unilab.edu     |
 * | Profesor      | profesor2@unilab.edu     |
 * | Estudiante    | estudiante1@unilab.edu   |
 * | Estudiante    | estudiante2@unilab.edu   |
 * | Estudiante    | estudiante3@unilab.edu   |
 * | Externo       | externo@unilab.edu       |
 *
 * Todos tienen primer_login = false (cuentas ya activadas para pruebas).
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const PASSWORD_PLAIN = 'Password123!';
const PERIODO_ACADEMICO = '2026-1';

const ESCUELAS_Y_CURSOS: { escuela: string; cursos: string[] }[] = [
  {
    escuela: 'Escuela de Derecho',
    cursos: ['Gobierno y Relaciones Internacionales', 'Derecho'],
  },
  {
    escuela: 'Escuela de Educación',
    cursos: ['Entrenamiento Deportivo', 'Licenciatura en Educación Infantil'],
  },
  {
    escuela: 'Escuela de Ingeniería y Sostenibilidad',
    cursos: ['Ingeniería Civil', 'Ingeniería Energética'],
  },
  {
    escuela: 'Escuela de Negocios',
    cursos: [
      'Finanzas y Negocios Internacionales',
      'Administración de Empresas',
      'Contabilidad Pública',
    ],
  },
  {
    escuela: 'Escuela de Software y Desarrollo Tecnológico',
    cursos: [
      'Matemáticas Aplicadas y Ciencias de Datos',
      'Ingeniería Ambiental y de Saneamiento',
      'Ingeniería Electrónica',
      'Ingeniería de Software y Computación',
    ],
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function limpiarDatos(): Promise<void> {
  await prisma.asistencias.deleteMany();
  await prisma.inscripciones.deleteMany();
  await prisma.evento_jornadas.deleteMany();
  await prisma.eventos.deleteMany();
  await prisma.semillero_miembros.deleteMany();
  await prisma.semillero_profesores.deleteMany();
  await prisma.proyecto_vistas.deleteMany();
  await prisma.comentarios.deleteMany();
  await prisma.calificaciones.deleteMany();
  await prisma.proyecto_autores.deleteMany();
  await prisma.proyecto_coordinadores.deleteMany();
  await prisma.proyectos.deleteMany();
  await prisma.curso_autorizaciones.deleteMany();
  await prisma.semilleros.deleteMany();
  await prisma.cursos.deleteMany();
  await prisma.perfiles_coordinador.deleteMany();
  await prisma.perfiles_profesor.deleteMany();
  await prisma.perfiles_estudiante.deleteMany();
  await prisma.perfiles_externo.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.escuelas.deleteMany();
  await prisma.roles.deleteMany();
}

async function main(): Promise<void> {
  console.log('Iniciando seed...');
  await limpiarDatos();

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

  const roles = await Promise.all(
    [
      { nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema' },
      { nombre_rol: 'Coordinador', descripcion: 'Dashboard analítico y reportes' },
      { nombre_rol: 'Profesor', descripcion: 'Autoriza proyectos y gestiona semilleros' },
      { nombre_rol: 'Estudiante', descripcion: 'Crea y publica proyectos académicos' },
      { nombre_rol: 'Externo', descripcion: 'Usuario externo a la universidad' },
    ].map((rol) => prisma.roles.create({ data: rol })),
  );

  const rolPorNombre = Object.fromEntries(roles.map((r) => [r.nombre_rol, r.id_rol]));

  const admin = await prisma.usuarios.create({
    data: {
      id_rol: rolPorNombre['Administrador'],
      nombres: 'Ana',
      apellidos: 'Administradora',
      email: 'admin@unilab.edu',
      password_hash: passwordHash,
      documento_identidad: '1000000001',
      telefono: '3000000001',
      activo: true,
      primer_login: false,
    },
  });

  const coordinador = await prisma.usuarios.create({
    data: {
      id_rol: rolPorNombre['Coordinador'],
      nombres: 'Carlos',
      apellidos: 'Coordinador',
      email: 'coordinador@unilab.edu',
      password_hash: passwordHash,
      documento_identidad: '1000000002',
      telefono: '3000000002',
      activo: true,
      primer_login: false,
      created_by: admin.id_usuario,
      perfil_coordinador: {
        create: {
          cargo: 'Coordinador Académico',
          dependencia: 'Vicerrectoría Académica',
          created_by: admin.id_usuario,
        },
      },
    },
  });

  const escuelasCreadas: Record<string, number> = {};
  for (const { escuela, cursos } of ESCUELAS_Y_CURSOS) {
    const escuelaDb = await prisma.escuelas.create({
      data: {
        nombre_escuela: escuela,
        created_by: admin.id_usuario,
      },
    });
    escuelasCreadas[escuela] = escuelaDb.id_escuela;

    for (const nombreCurso of cursos) {
      await prisma.cursos.create({
        data: {
          id_escuela: escuelaDb.id_escuela,
          nombre_curso: nombreCurso,
          periodo_academico: PERIODO_ACADEMICO,
          created_by: admin.id_usuario,
        },
      });
    }
  }

  const idEscuelaSoftware = escuelasCreadas['Escuela de Software y Desarrollo Tecnológico'];
  const idEscuelaIngenieria = escuelasCreadas['Escuela de Ingeniería y Sostenibilidad'];
  const idEscuelaNegocios = escuelasCreadas['Escuela de Negocios'];

  const profesor1 = await prisma.usuarios.create({
    data: {
      id_rol: rolPorNombre['Profesor'],
      nombres: 'María',
      apellidos: 'Profesora Líder',
      email: 'profesor1@unilab.edu',
      password_hash: passwordHash,
      documento_identidad: '1000000003',
      telefono: '3000000003',
      activo: true,
      primer_login: false,
      created_by: admin.id_usuario,
      perfil_profesor: {
        create: {
          codigo_docente: 'DOC-001',
          id_escuela: idEscuelaSoftware,
          created_by: admin.id_usuario,
        },
      },
    },
  });

  const profesor2 = await prisma.usuarios.create({
    data: {
      id_rol: rolPorNombre['Profesor'],
      nombres: 'Luis',
      apellidos: 'Profesor',
      email: 'profesor2@unilab.edu',
      password_hash: passwordHash,
      documento_identidad: '1000000004',
      telefono: '3000000004',
      activo: true,
      primer_login: false,
      created_by: admin.id_usuario,
      perfil_profesor: {
        create: {
          codigo_docente: 'DOC-002',
          id_escuela: idEscuelaIngenieria,
          created_by: admin.id_usuario,
        },
      },
    },
  });

  await prisma.usuarios.createMany({
    data: [
      {
        id_rol: rolPorNombre['Estudiante'],
        nombres: 'Sofía',
        apellidos: 'Estudiante',
        email: 'estudiante1@unilab.edu',
        password_hash: passwordHash,
        documento_identidad: '1000000005',
        telefono: '3000000005',
        activo: true,
        primer_login: false,
        created_by: admin.id_usuario,
      },
      {
        id_rol: rolPorNombre['Estudiante'],
        nombres: 'Diego',
        apellidos: 'Estudiante',
        email: 'estudiante2@unilab.edu',
        password_hash: passwordHash,
        documento_identidad: '1000000006',
        telefono: '3000000006',
        activo: true,
        primer_login: false,
        created_by: admin.id_usuario,
      },
      {
        id_rol: rolPorNombre['Estudiante'],
        nombres: 'Valentina',
        apellidos: 'Estudiante',
        email: 'estudiante3@unilab.edu',
        password_hash: passwordHash,
        documento_identidad: '1000000007',
        telefono: '3000000007',
        activo: true,
        primer_login: false,
        created_by: admin.id_usuario,
      },
    ],
  });

  const estudiantes = await prisma.usuarios.findMany({
    where: { email: { in: ['estudiante1@unilab.edu', 'estudiante2@unilab.edu', 'estudiante3@unilab.edu'] } },
    orderBy: { id_usuario: 'asc' },
  });

  await prisma.perfiles_estudiante.createMany({
    data: [
      {
        id_usuario: estudiantes[0].id_usuario,
        codigo_estudiantil: 'EST-001',
        id_escuela: idEscuelaSoftware,
        created_by: admin.id_usuario,
      },
      {
        id_usuario: estudiantes[1].id_usuario,
        codigo_estudiantil: 'EST-002',
        id_escuela: idEscuelaIngenieria,
        created_by: admin.id_usuario,
      },
      {
        id_usuario: estudiantes[2].id_usuario,
        codigo_estudiantil: 'EST-003',
        id_escuela: idEscuelaNegocios,
        created_by: admin.id_usuario,
      },
    ],
  });

  const externo = await prisma.usuarios.create({
    data: {
      id_rol: rolPorNombre['Externo'],
      nombres: 'Pedro',
      apellidos: 'Externo',
      email: 'externo@unilab.edu',
      password_hash: passwordHash,
      documento_identidad: '1000000008',
      telefono: '3000000008',
      activo: true,
      primer_login: false,
      created_by: admin.id_usuario,
      perfil_externo: {
        create: {
          institucion: 'Empresa Aliada S.A.S.',
          ocupacion: 'Desarrollador de software',
          created_by: admin.id_usuario,
        },
      },
    },
  });

  const semillero = await prisma.semilleros.create({
    data: {
      nombre_semillero: 'Semillero de Innovación Tecnológica',
      descripcion: 'Semillero de prueba enfocado en proyectos de software y datos.',
      id_escuela: idEscuelaSoftware,
      id_profesor_lider: profesor1.id_usuario,
      activo: true,
      created_by: admin.id_usuario,
    },
  });

  await prisma.semillero_profesores.create({
    data: {
      id_semillero: semillero.id_semillero,
      id_profesor: profesor1.id_usuario,
      es_lider: true,
      fecha_asignacion: new Date('2026-01-15'),
      created_by: admin.id_usuario,
    },
  });

  await prisma.semillero_profesores.create({
    data: {
      id_semillero: semillero.id_semillero,
      id_profesor: profesor2.id_usuario,
      es_lider: false,
      fecha_asignacion: new Date('2026-02-01'),
      created_by: admin.id_usuario,
    },
  });

  const evento = await prisma.eventos.create({
    data: {
      nombre_evento: 'Foro Universitario de Proyectos 2026',
      tipo_evento: 'Foro académico',
      descripcion: 'Evento de prueba con dos jornadas y control de asistencia por QR.',
      fecha_inicio: new Date('2026-06-15'),
      fecha_fin: new Date('2026-06-16'),
      lugar: 'Auditorio Principal — Campus Central',
      id_organizador: admin.id_usuario,
      estado: 'planeado',
      requiere_pago: false,
      created_by: admin.id_usuario,
    },
  });

  await prisma.evento_jornadas.createMany({
    data: [
      {
        id_evento: evento.id_evento,
        nombre_jornada: 'Día 1 - Jornada Mañana',
        fecha: new Date('2026-06-15'),
        hora_inicio: new Date('1970-01-01T08:00:00'),
        hora_fin: new Date('1970-01-01T12:00:00'),
        codigo_qr: randomUUID(),
        created_by: admin.id_usuario,
      },
      {
        id_evento: evento.id_evento,
        nombre_jornada: 'Día 2 - Jornada Tarde',
        fecha: new Date('2026-06-16'),
        hora_inicio: new Date('1970-01-01T14:00:00'),
        hora_fin: new Date('1970-01-01T18:00:00'),
        codigo_qr: randomUUID(),
        created_by: admin.id_usuario,
      },
    ],
  });

  const totalCursos = await prisma.cursos.count();

  console.log('Seed completado exitosamente.');
  console.log(`  Roles: 5`);
  console.log(`  Usuarios: 8 (Admin, Coordinador, 2 Profesores, 3 Estudiantes, 1 Externo)`);
  console.log(`  Escuelas: 5`);
  console.log(`  Cursos: ${totalCursos}`);
  console.log(`  Semilleros: 1`);
  console.log(`  Eventos: 1 (2 jornadas)`);
  console.log(`  Contraseña de prueba: ${PASSWORD_PLAIN}`);
  console.log(`  Coordinador id: ${coordinador.id_usuario}, Externo id: ${externo.id_usuario}`);
}

main()
  .catch((error: unknown) => {
    console.error('Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
