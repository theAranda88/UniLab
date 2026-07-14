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
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const PASSWORD_PLAIN = 'Password123!';
const PERIODO_ACADEMICO = '2026-1';
const API_BASE = process.env.API_PUBLIC_URL ?? 'http://localhost:3000';

const SEED_IMAGENES_FALLBACK = [
  path.resolve(__dirname, '../../unilab_front/src/assets/images/quime-02.png'),
  path.resolve(__dirname, '../../unilab_front/src/assets/images/Gemini_Generated_Image_tmoxxftmoxxftmox.png'),
  path.resolve(__dirname, '../../unilab_front/src/assets/images/uniautonoma_cauca.png'),
];

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=960&auto=format&fit=crop&q=80`;

interface ImagenSeedRemota {
  url: string;
  nombre: string;
}

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
  await prisma.proyecto_imagenes.deleteMany();
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
  await prisma.escuelas.deleteMany();
  await prisma.usuarios.deleteMany();
  await prisma.roles.deleteMany();

  const uploadsProyectos = path.join(process.cwd(), 'uploads', 'proyectos');
  if (fs.existsSync(uploadsProyectos)) {
    fs.rmSync(uploadsProyectos, { recursive: true, force: true });
  }
}

async function descargarImagenSeed(url: string, destino: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'UniLab-Seed/1.0', Accept: 'image/*' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`Descarga fallida (${res.status}): ${url}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destino, buffer);

  const contentType = res.headers.get('content-type')?.split(';')[0]?.trim();
  if (contentType === 'image/png' || contentType === 'image/webp' || contentType === 'image/jpeg') {
    return contentType;
  }
  return destino.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

function extensionPorMime(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

async function copiarImagenFallback(origen: string, destino: string): Promise<string> {
  fs.copyFileSync(origen, destino);
  return 'image/png';
}

async function registrarImagenesProyecto(
  id_proyecto: number,
  created_by: number,
  imagenes: ImagenSeedRemota[],
): Promise<void> {
  const dir = path.join(process.cwd(), 'uploads', 'proyectos', String(id_proyecto));
  fs.mkdirSync(dir, { recursive: true });

  let primeraRuta: string | null = null;

  for (let i = 0; i < imagenes.length; i += 1) {
    const seed = imagenes[i];
    let mime = 'image/jpeg';
    let nombre = `${randomUUID()}.jpg`;
    let destino = path.join(dir, nombre);

    try {
      mime = await descargarImagenSeed(seed.url, destino);
      const ext = extensionPorMime(mime);
      if (!destino.endsWith(ext)) {
        const renombrado = path.join(dir, `${randomUUID()}${ext}`);
        fs.renameSync(destino, renombrado);
        destino = renombrado;
        nombre = path.basename(renombrado);
      }
      console.log(`  ↳ Imagen ${i + 1}/${imagenes.length}: ${seed.nombre}`);
    } catch (err) {
      const fallback = SEED_IMAGENES_FALLBACK[i % SEED_IMAGENES_FALLBACK.length];
      nombre = `${randomUUID()}.png`;
      destino = path.join(dir, nombre);
      mime = await copiarImagenFallback(fallback, destino);
      console.warn(`  ⚠ Fallback imagen "${seed.nombre}":`, (err as Error).message);
    }

    const ruta_archivo = `/uploads/proyectos/${id_proyecto}/${nombre}`;
    if (!primeraRuta) primeraRuta = ruta_archivo;

    await prisma.proyecto_imagenes.create({
      data: {
        id_proyecto,
        ruta_archivo,
        nombre_original: seed.nombre,
        mime_type: mime,
        orden: i + 1,
        created_by,
      },
    });
  }

  if (primeraRuta) {
    await prisma.proyectos.update({
      where: { id_proyecto },
      data: { url_imagen: `${API_BASE}${primeraRuta}` },
    });
  }
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

  await prisma.semillero_miembros.create({
    data: {
      id_semillero: semillero.id_semillero,
      id_estudiante: estudiantes[0].id_usuario,
      estado_solicitud: 'aprobado',
      puede_publicar: true,
      fecha_autorizacion: new Date('2026-02-10'),
      id_profesor_autorizador: profesor1.id_usuario,
      created_by: admin.id_usuario,
    },
  });

  const cursosPorEscuela = await prisma.cursos.findMany({
    include: { escuela: true },
    orderBy: { id_curso: 'asc' },
  });

  const cursoPorNombre = (fragmentoEscuela: string, fragmentoCurso?: string) => {
    const lista = cursosPorEscuela.filter((c) =>
      c.escuela.nombre_escuela.includes(fragmentoEscuela),
    );
    if (fragmentoCurso) {
      return lista.find((c) => c.nombre_curso.includes(fragmentoCurso)) ?? lista[0];
    }
    return lista[0];
  };

  type TipoProyecto = 'web' | 'movil' | 'podcast' | 'otro';

  interface ProyectoDemo {
    escuelaMatch: string;
    cursoMatch?: string;
    estudianteIdx: number;
    titulo: string;
    descripcion: string;
    tipo_proyecto: TipoProyecto;
    url_aplicativo: string;
    imagenesSeed: ImagenSeedRemota[];
    url_apk?: string;
    url_youtube?: string;
    url_spotify?: string;
    conSemillero?: boolean;
  }

  const proyectosDemo: ProyectoDemo[] = [
    {
      escuelaMatch: 'Software',
      cursoMatch: 'Software',
      estudianteIdx: 0,
      titulo: 'UniLab Portal Códice 3D',
      descripcion:
        'Plataforma web de divulgación académica con navegación inmersiva por escuelas y proyectos publicados. Integra autenticación, recursos descargables y visualización pública de investigaciones estudiantiles.',
      tipo_proyecto: 'web',
      url_aplicativo: 'https://unilab.uniautonoma.edu.co',
      imagenesSeed: [
        { url: UNSPLASH('photo-1498050108023-c5249f4df085'), nombre: 'codice-desarrollo-web.jpg' },
        { url: UNSPLASH('photo-1555066931-4365d14bab8c'), nombre: 'codice-codigo-pantalla.jpg' },
        { url: UNSPLASH('photo-1460925895917-afdab827c52f'), nombre: 'codice-dashboard-analitica.jpg' },
      ],
      conSemillero: true,
    },
    {
      escuelaMatch: 'Software',
      cursoMatch: 'Electrónica',
      estudianteIdx: 0,
      titulo: 'Monitor IoT Campus',
      descripcion:
        'Aplicación móvil para monitoreo de sensores ambientales en tiempo real dentro del campus universitario, con alertas push y panel de analítica.',
      tipo_proyecto: 'movil',
      url_aplicativo: 'https://github.com/unilab/iot-campus',
      imagenesSeed: [
        { url: UNSPLASH('photo-1635070041078-e363dbe005cb'), nombre: 'iot-dashboard-sensores.jpg' },
        { url: UNSPLASH('photo-1512941937669-90a1b58e7e9c'), nombre: 'iot-app-movil.jpg' },
        { url: UNSPLASH('photo-1517694712202-14dd9538aa97'), nombre: 'iot-monitoreo-datos.jpg' },
      ],
      url_apk: 'https://github.com/unilab/iot-campus/releases/latest',
    },
    {
      escuelaMatch: 'Derecho',
      estudianteIdx: 1,
      titulo: 'LegalTech: Análisis Jurisprudencial',
      descripcion:
        'Herramienta web de apoyo para consulta estructurada de precedentes constitucionales con filtros por materia, tribunal y año.',
      tipo_proyecto: 'web',
      url_aplicativo: 'https://juris.uniautonoma.edu.co',
      imagenesSeed: [
        { url: UNSPLASH('photo-1450101499163-c8848c66ca85'), nombre: 'legaltech-documentos-juridicos.jpg' },
        { url: UNSPLASH('photo-1454165804606-c3d57bc86b40'), nombre: 'legaltech-consulta-precedentes.jpg' },
      ],
    },
    {
      escuelaMatch: 'Derecho',
      estudianteIdx: 2,
      titulo: 'Podcast Justicia Local',
      descripcion:
        'Serie podcast sobre mediación comunitaria y acceso a la justicia en el Cauca. Episodios con entrevistas a operadores jurídicos regionales.',
      tipo_proyecto: 'podcast',
      url_aplicativo: 'https://open.spotify.com/show/demo-justicia',
      imagenesSeed: [
        { url: UNSPLASH('photo-1590602847861-f357a9332bbc'), nombre: 'podcast-microfono-estudio.jpg' },
        { url: UNSPLASH('photo-1516280440614-37939bbacd81'), nombre: 'podcast-grabacion-episodio.jpg' },
        { url: UNSPLASH('photo-1522202176988-66273c2fd55f'), nombre: 'podcast-mediacion-comunitaria.jpg' },
      ],
      url_spotify: 'https://open.spotify.com/show/demo-justicia',
      url_youtube: 'https://www.youtube.com/playlist?list=demo-justicia',
    },
    {
      escuelaMatch: 'Ingeniería',
      cursoMatch: 'Civil',
      estudianteIdx: 1,
      titulo: 'Estructuras Auto-Monitoreadas',
      descripcion:
        'Prototipo web de visualización de datos sísmicos capturados por sensores embebidos en modelos estructurales a escala.',
      tipo_proyecto: 'web',
      url_aplicativo: 'https://estructuras.uniautonoma.edu.co',
      imagenesSeed: [
        { url: UNSPLASH('photo-1541888946425-d81bb19240f5'), nombre: 'estructuras-puente-ingenieria.jpg' },
        { url: UNSPLASH('photo-1504307651254-35680f356dfd'), nombre: 'estructuras-obra-monitoreo.jpg' },
      ],
    },
    {
      escuelaMatch: 'Ingeniería',
      cursoMatch: 'Energética',
      estudianteIdx: 1,
      titulo: 'Simulador Matriz Energética',
      descripcion:
        'Aplicación de simulación energética para comparar escenarios de generación solar vs convencional en zonas rurales.',
      tipo_proyecto: 'otro',
      url_aplicativo: 'https://energia.uniautonoma.edu.co/sim',
      imagenesSeed: [
        { url: UNSPLASH('photo-1509391366360-2e959784a276'), nombre: 'energia-paneles-solares.jpg' },
        { url: UNSPLASH('photo-1473341304170-971dccb5ac1e'), nombre: 'energia-red-electrica.jpg' },
      ],
    },
    {
      escuelaMatch: 'Educación',
      estudianteIdx: 2,
      titulo: 'Lúdica Matemática AR',
      descripcion:
        'Experiencia web interactiva de realidad aumentada para enseñanza de operaciones básicas en primaria.',
      tipo_proyecto: 'web',
      url_aplicativo: 'https://ludica.uniautonoma.edu.co',
      imagenesSeed: [
        { url: UNSPLASH('photo-1503676260728-1c00da094a0b'), nombre: 'ludica-aula-interactiva.jpg' },
        { url: UNSPLASH('photo-1522202176988-66273c2fd55f'), nombre: 'ludica-aprendizaje-colaborativo.jpg' },
        { url: UNSPLASH('photo-1531482615713-2afd69097998'), nombre: 'ludica-tecnologia-educativa.jpg' },
      ],
    },
    {
      escuelaMatch: 'Educación',
      estudianteIdx: 0,
      titulo: 'Podcast Pedagogía Deportiva',
      descripcion:
        'Podcast educativo sobre inclusión deportiva en instituciones oficiales, con casos de estudio y entrevistas a docentes.',
      tipo_proyecto: 'podcast',
      url_aplicativo: 'https://podcasters.spotify.com/pod/show/pedagogia-deportiva',
      imagenesSeed: [
        { url: UNSPLASH('photo-1511671782779-c97d3d27a1d4'), nombre: 'pedagogia-audio-deportivo.jpg' },
        { url: UNSPLASH('photo-1552664730-d307ca884978'), nombre: 'pedagogia-equipo-docente.jpg' },
      ],
      url_spotify: 'https://podcasters.spotify.com/pod/show/pedagogia-deportiva',
      url_youtube: 'https://www.youtube.com/@pedagogiadeportiva',
    },
    {
      escuelaMatch: 'Negocios',
      estudianteIdx: 2,
      titulo: 'Dashboard Finanzas Comunitarias',
      descripcion:
        'Tablero web de indicadores económicos locales para emprendimientos del sector agroindustrial del Cauca.',
      tipo_proyecto: 'web',
      url_aplicativo: 'https://finanzas.uniautonoma.edu.co',
      imagenesSeed: [
        { url: UNSPLASH('photo-1551288049-bebda4e38f71'), nombre: 'finanzas-graficos-indicadores.jpg' },
        { url: UNSPLASH('photo-1556761175-b413da4baf72'), nombre: 'finanzas-equipo-analisis.jpg' },
      ],
    },
    {
      escuelaMatch: 'Negocios',
      estudianteIdx: 2,
      titulo: 'Podcast Economía Regional',
      descripcion:
        'Serie de episodios sobre resiliencia económica postconflicto con datos abiertos y voces de líderes comunitarios.',
      tipo_proyecto: 'podcast',
      url_aplicativo: 'https://open.spotify.com/show/economia-cauca',
      imagenesSeed: [
        { url: UNSPLASH('photo-1590602847861-f357a9332bbc'), nombre: 'economia-podcast-microfono.jpg' },
        { url: UNSPLASH('photo-1551288049-bebda4e38f71'), nombre: 'economia-datos-regionales.jpg' },
      ],
      url_spotify: 'https://open.spotify.com/show/economia-cauca',
      url_youtube: 'https://www.youtube.com/playlist?list=economia-cauca',
    },
  ];

  let proyectosCreados = 0;
  for (const demo of proyectosDemo) {
    const curso = cursoPorNombre(demo.escuelaMatch, demo.cursoMatch);
    if (!curso) continue;

    const estudiante = estudiantes[demo.estudianteIdx];
    const proyecto = await prisma.proyectos.create({
      data: {
        id_curso: curso.id_curso,
        id_semillero: demo.conSemillero ? semillero.id_semillero : undefined,
        id_estudiante_creador: estudiante.id_usuario,
        titulo: demo.titulo,
        descripcion: demo.descripcion,
        tipo_proyecto: demo.tipo_proyecto,
        url_aplicativo: demo.url_aplicativo,
        url_imagen: null,
        url_apk: demo.url_apk,
        url_youtube: demo.url_youtube,
        url_spotify: demo.url_spotify,
        estado_proyecto: 'publicado',
        id_aprobador: profesor1.id_usuario,
        fecha_publicacion: new Date('2026-03-01'),
        contador_vistas: Math.floor(Math.random() * 120) + 15,
        created_by: admin.id_usuario,
      },
    });

    await prisma.proyecto_coordinadores.create({
      data: {
        id_proyecto: proyecto.id_proyecto,
        id_profesor: profesor1.id_usuario,
        created_by: admin.id_usuario,
      },
    });

    await prisma.proyecto_autores.create({
      data: {
        id_proyecto: proyecto.id_proyecto,
        id_estudiante: estudiante.id_usuario,
        rol_autor: 'principal',
        created_by: admin.id_usuario,
      },
    });

    console.log(`Proyecto: ${demo.titulo}`);
    await registrarImagenesProyecto(
      proyecto.id_proyecto,
      admin.id_usuario,
      demo.imagenesSeed,
    );

    if (demo.estudianteIdx !== 0) {
      await prisma.proyecto_autores.create({
        data: {
          id_proyecto: proyecto.id_proyecto,
          id_estudiante: estudiantes[0].id_usuario,
          rol_autor: 'colaborador',
          created_by: admin.id_usuario,
        },
      });
    }

    proyectosCreados += 1;
  }

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
  console.log(`  Proyectos publicados: ${proyectosCreados}`);
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
