/**
 * SEED DE DATOS DE DEMOSTRACIÓN — UniLab / Eduinova
 *
 * Contraseña para TODOS los usuarios sembrados: Password123!
 *
 * | Rol           | Email                         | Notas                                      |
 * |---------------|-------------------------------|--------------------------------------------|
 * | Administrador | admin@unilab.edu              |                                            |
 * | Coordinador   | coordinador@unilab.edu        | Encargado de 3 escuelas                    |
 * | Coordinador   | coordinadora2@unilab.edu      | Encargada de 2 escuelas                    |
 * | Profesor      | profesor1@unilab.edu          | Software · líder del semillero de Innovación |
 * | Profesor      | profesor2@unilab.edu          | Ingeniería                                 |
 * | Profesor      | profesor3 … profesor10        | 2 por escuela                              |
 * | Estudiante    | estudiante1@unilab.edu        | Software · perfil CvLAC completo           |
 * | Estudiante    | estudiante2@unilab.edu        | Ingeniería · ve el aviso de completar perfil |
 * | Estudiante    | estudiante3@unilab.edu        | Negocios                                   |
 * | Estudiante    | estudiante4 … estudiante30    | 6 por escuela                              |
 * | Externo       | externo@unilab.edu            |                                            |
 * | Externo       | externo2, externo3            |                                            |
 *
 * Qué siembra: 5 escuelas con imágenes, cursos, 11 semilleros (portada, evidencias, profesores y
 * miembros), ~50 proyectos (publicados, en revisión, borrador y rechazados) con imágenes, coautores,
 * calificaciones y comentarios, 7 eventos con jornadas, inscripciones, asistencias y evidencias, y
 * perfiles tipo CvLAC (titular, biografía, especialidades, fortalezas, enlaces y formación).
 *
 * Las imágenes son enlaces directos (Unsplash): no se descargan archivos, así que cargan igual en
 * local y en Docker. El seed vacía TODAS las tablas de la aplicación antes de sembrar.
 *
 * Ejecutar: npx prisma migrate deploy && npx prisma db seed
 */

import 'dotenv/config';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const PASSWORD_PLAIN = 'Password123!';
const PERIODO_ACADEMICO = '2026-2';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** PRNG determinista: el seed produce siempre los mismos datos. */
function crearAleatorio(semilla: number) {
  let a = semilla;
  const siguiente = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    entre: (min: number, max: number) => Math.floor(siguiente() * (max - min + 1)) + min,
    elegir: <T>(lista: readonly T[]): T => lista[Math.floor(siguiente() * lista.length)],
    varios: <T>(lista: readonly T[], n: number): T[] => {
      const copia = [...lista];
      const salida: T[] = [];
      while (copia.length && salida.length < n) salida.push(copia.splice(Math.floor(siguiente() * copia.length), 1)[0]);
      return salida;
    },
    prob: (p: number) => siguiente() < p,
  };
}
const rnd = crearAleatorio(20261116);

const img = (id: string, w = 1200) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

/** Imágenes verificadas por temática (todas responden 200). */
const IMG = {
  software: [
    'photo-1498050108023-c5249f4df085', 'photo-1555066931-4365d14bab8c', 'photo-1460925895917-afdab827c52f',
    'photo-1517694712202-14dd9538aa97', 'photo-1488590528505-98d2b5aba04b', 'photo-1461749280684-dccba630e2f6',
    'photo-1515879218367-8466d910aaa4', 'photo-1531297484001-80022131f5a1', 'photo-1519389950473-47ba0277781c',
  ],
  ia: ['photo-1620712943543-bcc4688e7485', 'photo-1677442136019-21780ecad995', 'photo-1485827404703-89b55fcc595e', 'photo-1526374965328-7f61d4dc18c5'],
  seguridad: ['photo-1563986768609-322da13575f3', 'photo-1550751827-4bd374c3f58b', 'photo-1558494949-ef010cbdcc31', 'photo-1544197150-b99a580bb7a8'],
  electronica: ['photo-1518770660439-4636190af475', 'photo-1635070041078-e363dbe005cb', 'photo-1512941937669-90a1b58e7e9c', 'photo-1581091226825-a6a2a5aee158'],
  energia: ['photo-1509391366360-2e959784a276', 'photo-1473341304170-971dccb5ac1e', 'photo-1466611653911-95081537e5b7', 'photo-1497440001374-f26997328c1b', 'photo-1508514177221-188b1cf16e9d'],
  estructuras: ['photo-1541888946425-d81bb19240f5', 'photo-1504307651254-35680f356dfd', 'photo-1486406146926-c627a92ad1ab', 'photo-1479839672679-a46483c0e7c8'],
  ambiente: ['photo-1501594907352-04cda38ebc29', 'photo-1441974231531-c6227db76b6e', 'photo-1485083269755-a7b559a4fe5e', 'photo-1532996122724-e3c354a0b15b', 'photo-1611273426858-450d8e3c9fce', 'photo-1416879595882-3373a0480b5b'],
  laboratorio: ['photo-1532094349884-543bc11b234d', 'photo-1576086213369-97a306d36557', 'photo-1559757148-5c350d0d3c56'],
  negocios: ['photo-1551288049-bebda4e38f71', 'photo-1556761175-b413da4baf72', 'photo-1460472178825-e5240623afd5', 'photo-1559136555-9303baea8ebd', 'photo-1553877522-43269d4ea984', 'photo-1454165804606-c3d57bc86b40'],
  agro: ['photo-1500382017468-9049fed747ef', 'photo-1464226184884-fa280b87c399', 'photo-1416879595882-3373a0480b5b'],
  derecho: ['photo-1589829545856-d10d557cf95f', 'photo-1505664194779-8beaceb93744', 'photo-1450101499163-c8848c66ca85', 'photo-1521791055366-0d553872125f', 'photo-1481627834876-b7833e8f5570', 'photo-1507842217343-583bb7270b66'],
  comunidad: ['photo-1593113598332-cd288d649433', 'photo-1488521787991-ed7bbaae773c', 'photo-1522202176988-66273c2fd55f'],
  educacion: ['photo-1503676260728-1c00da094a0b', 'photo-1531482615713-2afd69097998', 'photo-1546410531-bb4caa6b424d', 'photo-1588072432836-e10032774350', 'photo-1577896851231-70ef18881754', 'photo-1497633762265-9d179a990aa6'],
  deporte: ['photo-1571260899304-425eee4c7efc', 'photo-1461896836934-ffe607ba8211', 'photo-1517649763962-0c623066013b', 'photo-1574629810360-7efbbe195018'],
  podcast: ['photo-1590602847861-f357a9332bbc', 'photo-1516280440614-37939bbacd81', 'photo-1511671782779-c97d3d27a1d4'],
  campus: ['photo-1523240795612-9a054b0db644', 'photo-1524178232363-1fb2b075b655', 'photo-1543269865-cbf427effbad', 'photo-1427504494785-3a9ca7044f45', 'photo-1434030216411-0b793f4b4173', 'photo-1501504905252-473c47e087f8', 'photo-1471107340929-a87cd0f5b5f3'],
  equipo: ['photo-1552664730-d307ca884978', 'photo-1517245386807-bb43f82c33c4', 'photo-1551434678-e076c223a692', 'photo-1517048676732-d65bc937f952', 'photo-1504384308090-c894fdcc538d', 'photo-1497366216548-37526070297c'],
  eventos: ['photo-1540575467063-178a50c2df87', 'photo-1475721027785-f74eccf877e2', 'photo-1505373877841-8d25f7d46678', 'photo-1511578314322-379afb476865', 'photo-1492684223066-81342ee5ff30'],
} as const;
type Tema = keyof typeof IMG;

const slug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const fecha = (iso: string) => new Date(`${iso}T00:00:00`);
const hora = (hhmm: string) => new Date(`1970-01-01T${hhmm}:00`);

// ---------------------------------------------------------------------------
// Catálogo de escuelas, personas, semilleros y proyectos
// ---------------------------------------------------------------------------

interface EscuelaDef {
  clave: 'derecho' | 'educacion' | 'ingenieria' | 'negocios' | 'software';
  nombre: string;
  descripcion: string;
  cursos: string[];
  imagenes: Tema[];
}

const ESCUELAS: EscuelaDef[] = [
  {
    clave: 'derecho',
    nombre: 'Escuela de Derecho',
    descripcion:
      'Forma profesionales del derecho comprometidos con la justicia, los derechos humanos y la construcción de paz en el Cauca, con énfasis en métodos alternativos de resolución de conflictos.',
    cursos: ['Gobierno y Relaciones Internacionales', 'Derecho'],
    imagenes: ['derecho', 'derecho', 'comunidad'],
  },
  {
    clave: 'educacion',
    nombre: 'Escuela de Educación',
    descripcion:
      'Licenciaturas y programas que transforman las aulas de la región con pedagogías activas, inclusión y deporte como herramienta de desarrollo social.',
    cursos: ['Entrenamiento Deportivo', 'Licenciatura en Educación Infantil'],
    imagenes: ['educacion', 'educacion', 'deporte'],
  },
  {
    clave: 'ingenieria',
    nombre: 'Escuela de Ingeniería y Sostenibilidad',
    descripcion:
      'Ingeniería para territorios sostenibles: energías renovables, infraestructura resiliente y gestión responsable de los recursos naturales.',
    cursos: ['Ingeniería Civil', 'Ingeniería Energética'],
    imagenes: ['energia', 'estructuras', 'ambiente'],
  },
  {
    clave: 'negocios',
    nombre: 'Escuela de Negocios',
    descripcion:
      'Emprendimiento, finanzas y gestión con impacto regional: acompañamos a las empresas y comunidades del Cauca a crecer de forma sostenible.',
    cursos: ['Finanzas y Negocios Internacionales', 'Administración de Empresas', 'Contabilidad Pública'],
    imagenes: ['negocios', 'equipo', 'agro'],
  },
  {
    clave: 'software',
    nombre: 'Escuela de Software y Desarrollo Tecnológico',
    descripcion:
      'Desarrollo de software, ciencia de datos, electrónica y ambiente: tecnología al servicio de los retos reales del territorio.',
    cursos: [
      'Matemáticas Aplicadas y Ciencias de Datos',
      'Ingeniería Ambiental y de Saneamiento',
      'Ingeniería Electrónica',
      'Ingeniería de Software y Computación',
    ],
    imagenes: ['software', 'ia', 'electronica'],
  },
];
type ClaveEscuela = EscuelaDef['clave'];

const NOMBRES_F = ['Sofía', 'Valentina', 'Isabella', 'Mariana', 'Camila', 'Daniela', 'Laura', 'Natalia', 'Juliana', 'Gabriela', 'Paula', 'Andrea', 'Lucía', 'Sara', 'Manuela', 'Carolina'];
const NOMBRES_M = ['Diego', 'Santiago', 'Sebastián', 'Mateo', 'Nicolás', 'Samuel', 'Juan Pablo', 'Andrés', 'Felipe', 'Daniel', 'Alejandro', 'Julián', 'David', 'Tomás', 'Esteban', 'Camilo'];
/** Nombres femeninos de las cuentas fijas (los aleatorios salen de NOMBRES_F). */
const NOMBRES_F_FIJOS = ['Ana', 'Patricia', 'María', 'Claudia', 'Liliana', 'Adriana', 'Gloria', 'Mónica'];
const retratosUsados = { women: 0, men: 0 };
/** Foto de perfil de demostración: retratos públicos de randomuser.me, sin repetir. */
function retrato(nombres: string): string {
  const nombre = nombres.split(' ')[0];
  const genero = NOMBRES_F.includes(nombre) || NOMBRES_F_FIJOS.includes(nombre) ? 'women' : 'men';
  const indice = (retratosUsados[genero]++ * 7 + 3) % 100;
  return `https://randomuser.me/api/portraits/${genero}/${indice}.jpg`;
}
const APELLIDOS = ['Muñoz', 'Ortega', 'Velasco', 'Cerón', 'Bolaños', 'Chicangana', 'Ordóñez', 'Paz', 'Collazos', 'Mosquera', 'Guevara', 'Sandoval', 'Rengifo', 'Caicedo', 'Burbano', 'Imbachí', 'Zúñiga', 'Hurtado', 'Valencia', 'López', 'Ramírez', 'Quintero', 'Erazo', 'Daza'];

const FORTALEZAS = ['Trabajo en equipo', 'Liderazgo', 'Comunicación asertiva', 'Pensamiento crítico', 'Resolución de problemas', 'Creatividad', 'Gestión del tiempo', 'Adaptabilidad', 'Investigación', 'Orientación a resultados'];

const ESPECIALIDADES: Record<ClaveEscuela, string[]> = {
  software: ['Angular', 'Node.js', 'TypeScript', 'Python', 'Ciencia de datos', 'Machine Learning', 'IoT', 'Ciberseguridad', 'PostgreSQL', 'UX/UI'],
  ingenieria: ['Energía solar', 'Modelado estructural', 'AutoCAD', 'Eficiencia energética', 'Gestión ambiental', 'BIM', 'Hidráulica'],
  negocios: ['Finanzas', 'Emprendimiento', 'Marketing digital', 'Análisis financiero', 'Comercio internacional', 'Power BI', 'Economía circular'],
  derecho: ['Derecho constitucional', 'Derechos humanos', 'Mediación', 'Derecho digital', 'Contratación estatal', 'Investigación jurídica'],
  educacion: ['Pedagogía', 'Didáctica', 'Educación inclusiva', 'Entrenamiento deportivo', 'Recreación', 'TIC en el aula'],
};

const PROGRAMA_TITULAR: Record<ClaveEscuela, string> = {
  software: 'Ingeniería de Software y Computación',
  ingenieria: 'Ingeniería Energética',
  negocios: 'Administración de Empresas',
  derecho: 'Derecho',
  educacion: 'Licenciatura en Educación Infantil',
};

interface ProyectoDef {
  titulo: string;
  descripcion: string;
  tipo: 'web' | 'movil' | 'podcast' | 'otro';
  tema: Tema;
  curso?: string;
}

interface SemilleroDef {
  escuela: ClaveEscuela;
  nombre: string;
  descripcion: string;
  tema: Tema;
  proyectos: ProyectoDef[];
}

const SEMILLEROS: SemilleroDef[] = [
  {
    escuela: 'software',
    nombre: 'Semillero de Innovación Tecnológica',
    descripcion: 'Desarrollamos plataformas web y móviles que acercan la universidad a la comunidad: portales, aplicaciones y herramientas abiertas.',
    tema: 'software',
    proyectos: [
      { titulo: 'UniLab Portal Códice 3D', descripcion: 'Plataforma web de divulgación académica con navegación inmersiva por escuelas, semilleros y proyectos publicados. Integra autenticación, recursos descargables y visualización pública de investigaciones estudiantiles.', tipo: 'web', tema: 'software', curso: 'Software' },
      { titulo: 'Agenda Campus Móvil', descripcion: 'Aplicación móvil que reúne horarios, eventos y avisos del campus con notificaciones personalizadas por programa académico.', tipo: 'movil', tema: 'software', curso: 'Software' },
      { titulo: 'Repositorio Abierto de Tesis', descripcion: 'Buscador web de trabajos de grado con filtros por escuela, año y línea de investigación, y vista previa de documentos.', tipo: 'web', tema: 'campus', curso: 'Software' },
      { titulo: 'Podcast Código Abierto', descripcion: 'Serie de episodios con desarrolladores de la región sobre software libre, comunidades tecnológicas y primeros empleos en tecnología.', tipo: 'podcast', tema: 'podcast' },
    ],
  },
  {
    escuela: 'software',
    nombre: 'Semillero de Inteligencia Artificial Aplicada',
    descripcion: 'Investigamos modelos de aprendizaje automático y visión por computador para problemas del agro, la salud y la educación en el Cauca.',
    tema: 'ia',
    proyectos: [
      { titulo: 'Detector de Roya en Café', descripcion: 'Modelo de visión por computador que identifica roya en hojas de café a partir de fotografías tomadas con el celular, con 92 % de precisión en pruebas de campo.', tipo: 'movil', tema: 'agro', curso: 'Datos' },
      { titulo: 'Predicción de Deserción Estudiantil', descripcion: 'Tablero web con modelos de riesgo de deserción basados en datos académicos anonimizados, para orientar el acompañamiento temprano.', tipo: 'web', tema: 'ia', curso: 'Datos' },
      { titulo: 'Asistente de Lectura Accesible', descripcion: 'Aplicación que convierte documentos académicos a audio y lenguaje sencillo para estudiantes con discapacidad visual o dificultades de lectura.', tipo: 'otro', tema: 'ia', curso: 'Software' },
    ],
  },
  {
    escuela: 'software',
    nombre: 'Semillero de Ciberseguridad',
    descripcion: 'Formamos talento en seguridad informática: análisis de vulnerabilidades, buenas prácticas y cultura digital segura.',
    tema: 'seguridad',
    proyectos: [
      { titulo: 'Escáner de Contraseñas Débiles', descripcion: 'Herramienta educativa que evalúa la fortaleza de contraseñas y explica, paso a paso, cómo mejorarlas sin almacenar ningún dato.', tipo: 'web', tema: 'seguridad', curso: 'Software' },
      { titulo: 'Monitor IoT Campus', descripcion: 'Aplicación móvil para monitoreo de sensores ambientales en tiempo real dentro del campus, con alertas push y panel de analítica.', tipo: 'movil', tema: 'electronica', curso: 'Electrónica' },
      { titulo: 'Capture The Flag Universitario', descripcion: 'Plataforma de retos de ciberseguridad por niveles para entrenar a estudiantes de todas las escuelas.', tipo: 'web', tema: 'seguridad', curso: 'Software' },
    ],
  },
  {
    escuela: 'ingenieria',
    nombre: 'Semillero de Energías Renovables',
    descripcion: 'Diseñamos soluciones solares y de eficiencia energética para zonas rurales no interconectadas del departamento.',
    tema: 'energia',
    proyectos: [
      { titulo: 'Simulador Matriz Energética', descripcion: 'Aplicación de simulación para comparar escenarios de generación solar frente a la convencional en zonas rurales.', tipo: 'otro', tema: 'energia', curso: 'Energética' },
      { titulo: 'Microred Solar Vereda El Tambo', descripcion: 'Diseño y monitoreo de una microred fotovoltaica comunitaria que abastece la escuela y el centro de salud de la vereda.', tipo: 'web', tema: 'energia', curso: 'Energética' },
      { titulo: 'Calculadora de Huella de Carbono', descripcion: 'Herramienta web que estima la huella de carbono de hogares y pequeños negocios y propone acciones de reducción.', tipo: 'web', tema: 'ambiente', curso: 'Energética' },
    ],
  },
  {
    escuela: 'ingenieria',
    nombre: 'Semillero de Estructuras y Materiales',
    descripcion: 'Estudiamos materiales locales y sistemas constructivos resilientes ante sismos para vivienda de interés social.',
    tema: 'estructuras',
    proyectos: [
      { titulo: 'Estructuras Auto-Monitoreadas', descripcion: 'Prototipo web de visualización de datos sísmicos capturados por sensores embebidos en modelos estructurales a escala.', tipo: 'web', tema: 'estructuras', curso: 'Civil' },
      { titulo: 'Guadua como Material Estructural', descripcion: 'Ensayos de resistencia de guadua tratada y guía de diseño para cubiertas y viviendas rurales de bajo costo.', tipo: 'otro', tema: 'laboratorio', curso: 'Civil' },
      { titulo: 'Inventario de Puentes Peatonales', descripcion: 'Aplicación móvil para registrar el estado de puentes peatonales rurales con fotografías y geolocalización.', tipo: 'movil', tema: 'estructuras', curso: 'Civil' },
    ],
  },
  {
    escuela: 'negocios',
    nombre: 'Semillero de Emprendimiento e Innovación',
    descripcion: 'Acompañamos ideas de negocio desde la validación hasta el primer cliente, con foco en emprendimientos de base comunitaria.',
    tema: 'negocios',
    proyectos: [
      { titulo: 'Mercado Campesino Digital', descripcion: 'Tienda en línea que conecta productores campesinos de Popayán con consumidores urbanos, con pagos y logística de entregas.', tipo: 'web', tema: 'agro', curso: 'Administración' },
      { titulo: 'Canvas Express', descripcion: 'Aplicación para construir y validar modelos de negocio en una tarde, pensada para talleres con emprendedores.', tipo: 'movil', tema: 'equipo', curso: 'Administración' },
      { titulo: 'Podcast Emprender en el Cauca', descripcion: 'Historias de emprendedores caucanos: errores, aprendizajes y consejos prácticos para empezar.', tipo: 'podcast', tema: 'podcast' },
    ],
  },
  {
    escuela: 'negocios',
    nombre: 'Semillero de Finanzas Sostenibles',
    descripcion: 'Analizamos finanzas personales, inclusión financiera e inversión responsable en la economía regional.',
    tema: 'negocios',
    proyectos: [
      { titulo: 'Dashboard Finanzas Comunitarias', descripcion: 'Tablero de indicadores económicos locales para emprendimientos del sector agroindustrial del Cauca.', tipo: 'web', tema: 'negocios', curso: 'Finanzas' },
      { titulo: 'Educación Financiera para Jóvenes', descripcion: 'Curso interactivo con retos semanales sobre ahorro, presupuesto y crédito responsable para estudiantes de colegio.', tipo: 'web', tema: 'educacion', curso: 'Finanzas' },
      { titulo: 'Podcast Economía Regional', descripcion: 'Episodios sobre resiliencia económica posconflicto con datos abiertos y voces de líderes comunitarios.', tipo: 'podcast', tema: 'podcast', curso: 'Finanzas' },
    ],
  },
  {
    escuela: 'derecho',
    nombre: 'Semillero de Derechos Humanos y Paz',
    descripcion: 'Investigamos y acompañamos procesos de memoria, reparación y acceso a la justicia en comunidades del Cauca.',
    tema: 'comunidad',
    proyectos: [
      { titulo: 'Podcast Justicia Local', descripcion: 'Serie sobre mediación comunitaria y acceso a la justicia en el Cauca, con entrevistas a operadores jurídicos regionales.', tipo: 'podcast', tema: 'podcast', curso: 'Derecho' },
      { titulo: 'Mapa de Rutas de Atención a Víctimas', descripcion: 'Mapa interactivo con las rutas institucionales de atención a víctimas por municipio, actualizado con las entidades locales.', tipo: 'web', tema: 'comunidad', curso: 'Derecho' },
      { titulo: 'Clínica Jurídica Itinerante', descripcion: 'Registro y seguimiento de las jornadas de asesoría jurídica gratuita en zonas rurales.', tipo: 'otro', tema: 'derecho', curso: 'Derecho' },
    ],
  },
  {
    escuela: 'derecho',
    nombre: 'Semillero de Derecho y Tecnología',
    descripcion: 'Exploramos los retos jurídicos de la tecnología: protección de datos, contratos inteligentes y justicia digital.',
    tema: 'derecho',
    proyectos: [
      { titulo: 'LegalTech: Análisis Jurisprudencial', descripcion: 'Herramienta web de apoyo para consulta estructurada de precedentes constitucionales con filtros por materia, tribunal y año.', tipo: 'web', tema: 'derecho', curso: 'Derecho' },
      { titulo: 'Guía de Protección de Datos para Pymes', descripcion: 'Asistente que guía a pequeñas empresas para cumplir la ley de protección de datos personales paso a paso.', tipo: 'web', tema: 'seguridad', curso: 'Derecho' },
      { titulo: 'Observatorio de Gobierno Abierto', descripcion: 'Seguimiento de la transparencia en contratación pública municipal con datos abiertos.', tipo: 'web', tema: 'negocios', curso: 'Gobierno' },
    ],
  },
  {
    escuela: 'educacion',
    nombre: 'Semillero de Pedagogías Activas',
    descripcion: 'Diseñamos experiencias de aprendizaje basadas en juego, proyectos y tecnología para la educación inicial y básica.',
    tema: 'educacion',
    proyectos: [
      { titulo: 'Lúdica Matemática AR', descripcion: 'Experiencia web de realidad aumentada para la enseñanza de operaciones básicas en primaria.', tipo: 'web', tema: 'educacion', curso: 'Infantil' },
      { titulo: 'Cuentos que Enseñan', descripcion: 'Colección de cuentos interactivos bilingües (español–nasa yuwe) para fortalecer la lectura en primera infancia.', tipo: 'movil', tema: 'educacion', curso: 'Infantil' },
      { titulo: 'Aula Maker Rural', descripcion: 'Guía y kit de bajo costo para montar espacios maker en escuelas rurales, con planes de clase por grado.', tipo: 'otro', tema: 'campus', curso: 'Infantil' },
    ],
  },
  {
    escuela: 'educacion',
    nombre: 'Semillero de Deporte y Sociedad',
    descripcion: 'Promovemos el deporte como herramienta de inclusión, salud y convivencia en colegios y barrios.',
    tema: 'deporte',
    proyectos: [
      { titulo: 'Podcast Pedagogía Deportiva', descripcion: 'Podcast educativo sobre inclusión deportiva en instituciones oficiales, con casos de estudio y entrevistas a docentes.', tipo: 'podcast', tema: 'podcast', curso: 'Deportivo' },
      { titulo: 'Plan de Entrenamiento Escolar', descripcion: 'Aplicación para que docentes de educación física diseñen y sigan planes de entrenamiento por grupo y edad.', tipo: 'movil', tema: 'deporte', curso: 'Deportivo' },
      { titulo: 'Liga Interbarrios Popayán', descripcion: 'Plataforma de inscripción, calendario y resultados de una liga de fútbol comunitaria con enfoque de convivencia.', tipo: 'web', tema: 'deporte', curso: 'Deportivo' },
    ],
  },
];

/** Proyectos independientes (sin semillero) por escuela. */
const INDEPENDIENTES: Record<ClaveEscuela, ProyectoDef[]> = {
  software: [
    { titulo: 'Bot de Tutorías por WhatsApp', descripcion: 'Asistente conversacional que agenda tutorías y responde preguntas frecuentes sobre trámites académicos.', tipo: 'otro', tema: 'ia', curso: 'Software' },
    { titulo: 'Calidad del Agua del Río Molino', descripcion: 'Monitoreo de parámetros fisicoquímicos del río con sensores de bajo costo y reportes abiertos para la comunidad.', tipo: 'web', tema: 'ambiente', curso: 'Ambiental' },
    { titulo: 'Visualizador de Datos Abiertos del Cauca', descripcion: 'Explorador de conjuntos de datos abiertos departamentales con gráficos y descargas.', tipo: 'web', tema: 'software', curso: 'Datos' },
  ],
  ingenieria: [
    { titulo: 'Riego Inteligente por Goteo', descripcion: 'Sistema de riego automatizado con sensores de humedad para huertas urbanas y escolares.', tipo: 'otro', tema: 'agro', curso: 'Energética' },
    { titulo: 'Bicicleta Generadora de Energía', descripcion: 'Prototipo didáctico que convierte el pedaleo en energía para cargar dispositivos en ferias de ciencia.', tipo: 'otro', tema: 'energia', curso: 'Energética' },
  ],
  negocios: [
    { titulo: 'Costeo Fácil para Artesanos', descripcion: 'Hoja de cálculo guiada y app para que artesanos fijen precios justos a partir de sus costos reales.', tipo: 'movil', tema: 'negocios', curso: 'Contabilidad' },
    { titulo: 'Estudio de Mercado del Café Especial', descripcion: 'Análisis de canales de exportación para cafés especiales del Cauca con recomendaciones para asociaciones.', tipo: 'otro', tema: 'agro', curso: 'Internacionales' },
  ],
  derecho: [
    { titulo: 'Consultorio Jurídico en Línea', descripcion: 'Formulario y seguimiento de consultas jurídicas gratuitas atendidas por estudiantes con supervisión docente.', tipo: 'web', tema: 'derecho', curso: 'Derecho' },
    { titulo: 'Podcast Derecho para Todos', descripcion: 'Explicaciones cortas y sencillas sobre derechos del consumidor, arrendamiento y familia.', tipo: 'podcast', tema: 'podcast', curso: 'Derecho' },
  ],
  educacion: [
    { titulo: 'Pausas Activas en el Aula', descripcion: 'Rutinas de pausas activas de 5 minutos con video para docentes de primaria.', tipo: 'web', tema: 'deporte', curso: 'Deportivo' },
    { titulo: 'Inclusión en Educación Inicial', descripcion: 'Guía práctica para adaptar actividades a niños y niñas con discapacidad en jardines infantiles.', tipo: 'otro', tema: 'educacion', curso: 'Infantil' },
  ],
};

const COMENTARIOS = [
  '¡Excelente trabajo! Se nota la dedicación del equipo.',
  'Muy útil para la comunidad, ojalá se pueda implementar pronto.',
  'Me encantó la presentación, muy clara y bien documentada.',
  '¿Tienen pensado ampliar el proyecto a otros municipios?',
  'Gran aporte para la región. Felicitaciones al semillero.',
  'La interfaz es muy intuitiva, la probé sin problemas.',
  'Sería interesante compartir los datos de las pruebas de campo.',
  'Proyecto muy completo, buen manejo de la metodología.',
];
const RESPUESTAS = ['¡Gracias! Estamos trabajando en la siguiente versión.', 'Sí, la idea es llevarlo a más municipios el próximo semestre.', 'Claro, pronto publicaremos los datos en el repositorio.'];

// ---------------------------------------------------------------------------
// Limpieza
// ---------------------------------------------------------------------------

/** Vacía todas las tablas de la aplicación (sirve en cualquier rama) y reinicia los identificadores. */
async function limpiarDatos(): Promise<void> {
  const tablas = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  if (tablas.length === 0) return;
  const lista = tablas.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`);
}

// ---------------------------------------------------------------------------
// Siembra
// ---------------------------------------------------------------------------

interface Persona {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  email: string;
  documento: string;
  telefono: string;
  escuela?: ClaveEscuela;
}

async function main(): Promise<void> {
  console.log('Iniciando seed de demostración...');
  await limpiarDatos();

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);
  let documento = 1000000000;
  const nuevoDocumento = () => String(++documento);

  // ---------------- Roles
  const roles: Record<string, number> = {};
  for (const r of [
    { nombre_rol: 'Administrador', descripcion: 'Acceso total al sistema' },
    { nombre_rol: 'Coordinador', descripcion: 'Dashboard analítico y reportes' },
    { nombre_rol: 'Profesor', descripcion: 'Autoriza proyectos y gestiona semilleros' },
    { nombre_rol: 'Estudiante', descripcion: 'Crea y publica proyectos académicos' },
    { nombre_rol: 'Externo', descripcion: 'Usuario externo a la universidad' },
  ]) {
    roles[r.nombre_rol] = (await prisma.roles.create({ data: r })).id_rol;
  }

  const crearUsuario = async (data: {
    rol: string;
    nombres: string;
    apellidos: string;
    email: string;
    created_by?: number;
    cv?: Partial<{
      titular: string;
      biografia: string;
      especialidades: string[];
      fortalezas: string[];
      url_linkedin: string;
      url_github: string;
      url_orcid: string;
      url_cvlac: string;
      url_google_scholar: string;
      mostrar_telefono: boolean;
    }>;
    perfil_cv_revisado?: boolean;
    /** Sin foto: perfiles incompletos, para ver el asistente de perfil. */
    sinFoto?: boolean;
  }): Promise<Persona> => {
    const doc = nuevoDocumento();
    const telefono = `31${doc.slice(-8)}`;
    const u = await prisma.usuarios.create({
      data: {
        id_rol: roles[data.rol],
        nombres: data.nombres,
        apellidos: data.apellidos,
        email: data.email,
        password_hash: passwordHash,
        documento_identidad: doc,
        telefono,
        activo: true,
        primer_login: false,
        perfil_cv_revisado: data.perfil_cv_revisado ?? true,
        foto_ruta: data.sinFoto ? null : retrato(data.nombres),
        created_by: data.created_by,
        ...(data.cv ?? {}),
      },
    });
    return { id_usuario: u.id_usuario, nombres: u.nombres, apellidos: u.apellidos, email: u.email, documento: doc, telefono };
  };

  const admin = await crearUsuario({
    rol: 'Administrador',
    nombres: 'Ana',
    apellidos: 'Administradora',
    email: 'admin@unilab.edu',
    cv: { titular: 'Administradora de la plataforma Eduinova' },
  });
  const A = admin.id_usuario;

  // ---------------- Escuelas, imágenes y cursos
  const escuelaId: Record<ClaveEscuela, number> = {} as Record<ClaveEscuela, number>;
  const cursosPorEscuela: Record<ClaveEscuela, { id_curso: number; nombre_curso: string }[]> = {} as never;
  for (const e of ESCUELAS) {
    const esc = await prisma.escuelas.create({
      data: { nombre_escuela: e.nombre, descripcion: e.descripcion, created_by: A },
    });
    escuelaId[e.clave] = esc.id_escuela;
    await prisma.escuela_imagenes.createMany({
      data: e.imagenes.map((tema, i) => {
        const id = IMG[tema][i % IMG[tema].length];
        return {
          id_escuela: esc.id_escuela,
          ruta_archivo: img(id, 1600),
          nombre_original: `${slug(e.nombre)}-${i + 1}.jpg`,
          mime_type: 'image/jpeg',
          orden: i + 1,
          created_by: A,
        };
      }),
    });
    cursosPorEscuela[e.clave] = [];
    for (const nombre_curso of e.cursos) {
      const c = await prisma.cursos.create({
        data: { id_escuela: esc.id_escuela, nombre_curso, periodo_academico: PERIODO_ACADEMICO, created_by: A },
      });
      cursosPorEscuela[e.clave].push({ id_curso: c.id_curso, nombre_curso });
    }
  }
  const cursoDe = (escuela: ClaveEscuela, fragmento?: string) =>
    (fragmento && cursosPorEscuela[escuela].find((c) => c.nombre_curso.includes(fragmento))) || cursosPorEscuela[escuela][0];

  // ---------------- Coordinadores (encargados de escuela)
  const coordinador = await crearUsuario({
    rol: 'Coordinador',
    nombres: 'Carlos',
    apellidos: 'Coordinador',
    email: 'coordinador@unilab.edu',
    created_by: A,
    cv: { titular: 'Coordinador académico · Vicerrectoría Académica', biografia: 'Acompaño a las escuelas en la gestión de proyectos, semilleros y eventos académicos.', fortalezas: ['Liderazgo', 'Planeación'] },
  });
  const coordinadora2 = await crearUsuario({
    rol: 'Coordinador',
    nombres: 'Patricia',
    apellidos: 'Velasco Paz',
    email: 'coordinadora2@unilab.edu',
    created_by: A,
    cv: { titular: 'Coordinadora de Investigación', fortalezas: ['Gestión de proyectos', 'Investigación'] },
  });
  await prisma.perfiles_coordinador.createMany({
    data: [
      { id_usuario: coordinador.id_usuario, cargo: 'Coordinador Académico', dependencia: 'Vicerrectoría Académica', profesion: 'Ingeniero de sistemas', created_by: A },
      { id_usuario: coordinadora2.id_usuario, cargo: 'Coordinadora de Investigación', dependencia: 'Dirección de Investigaciones', profesion: 'Economista', created_by: A },
    ],
  });
  for (const [clave, coord] of [
    ['software', coordinador], ['ingenieria', coordinador], ['negocios', coordinador], ['derecho', coordinadora2], ['educacion', coordinadora2],
  ] as const) {
    await prisma.escuelas.update({ where: { id_escuela: escuelaId[clave] }, data: { id_encargado: coord.id_usuario } });
  }

  // ---------------- Profesores (2 por escuela)
  const profesoresDef: { email: string; nombres: string; apellidos: string; escuela: ClaveEscuela }[] = [
    { email: 'profesor1@unilab.edu', nombres: 'María', apellidos: 'Profesora Líder', escuela: 'software' },
    { email: 'profesor2@unilab.edu', nombres: 'Luis', apellidos: 'Profesor', escuela: 'ingenieria' },
    { email: 'profesor3@unilab.edu', nombres: 'Jorge', apellidos: 'Imbachí Daza', escuela: 'software' },
    { email: 'profesor4@unilab.edu', nombres: 'Claudia', apellidos: 'Burbano Erazo', escuela: 'ingenieria' },
    { email: 'profesor5@unilab.edu', nombres: 'Hernán', apellidos: 'Caicedo Rengifo', escuela: 'negocios' },
    { email: 'profesor6@unilab.edu', nombres: 'Liliana', apellidos: 'Quintero Paz', escuela: 'negocios' },
    { email: 'profesor7@unilab.edu', nombres: 'Ricardo', apellidos: 'Sandoval Muñoz', escuela: 'derecho' },
    { email: 'profesor8@unilab.edu', nombres: 'Adriana', apellidos: 'Collazos Ortega', escuela: 'derecho' },
    { email: 'profesor9@unilab.edu', nombres: 'Fernando', apellidos: 'Hurtado López', escuela: 'educacion' },
    { email: 'profesor10@unilab.edu', nombres: 'Gloria', apellidos: 'Zúñiga Cerón', escuela: 'educacion' },
  ];
  const profesores: Persona[] = [];
  for (const [i, p] of profesoresDef.entries()) {
    const esc = ESCUELAS.find((e) => e.clave === p.escuela)!;
    const persona = await crearUsuario({
      rol: 'Profesor',
      nombres: p.nombres,
      apellidos: p.apellidos,
      email: p.email,
      created_by: A,
      cv: {
        titular: `Docente investigador · ${esc.nombre}`,
        biografia: `Docente de la ${esc.nombre}. Dirijo proyectos de investigación aplicada con estudiantes y acompaño semilleros de la escuela.`,
        especialidades: rnd.varios(ESPECIALIDADES[p.escuela], 4),
        fortalezas: rnd.varios(FORTALEZAS, 3),
        url_orcid: `https://orcid.org/0000-0002-${String(1000 + i * 37).padStart(4, '0')}-${String(2000 + i * 53).padStart(4, '0')}`,
        url_cvlac: `https://scienti.minciencias.gov.co/cvlac/visualizador/generarCurriculoCv.do?cod_rh=000${1450000 + i * 917}`,
        url_linkedin: `https://www.linkedin.com/in/${slug(`${p.nombres} ${p.apellidos}`)}`,
        ...(i % 3 === 0 ? { url_google_scholar: `https://scholar.google.com/citations?user=unilab${i}` } : {}),
      },
    });
    await prisma.perfiles_profesor.create({
      data: { id_usuario: persona.id_usuario, codigo_docente: `DOC-${String(i + 1).padStart(3, '0')}`, id_escuela: escuelaId[p.escuela], created_by: A },
    });
    await prisma.usuario_formacion.createMany({
      data: [
        { id_usuario: persona.id_usuario, titulo: PROGRAMA_TITULAR[p.escuela], institucion: 'Universidad del Cauca', nivel: 'pregrado', anio_inicio: 2004 + (i % 5), anio_fin: 2009 + (i % 5), created_by: persona.id_usuario },
        { id_usuario: persona.id_usuario, titulo: `Maestría en ${rnd.elegir(['Educación', 'Gestión de Proyectos', 'Ingeniería', 'Desarrollo Regional'])}`, institucion: rnd.elegir(['Universidad Nacional de Colombia', 'Universidad del Valle', 'Pontificia Universidad Javeriana']), nivel: 'maestria', anio_inicio: 2012 + (i % 4), anio_fin: 2014 + (i % 4), created_by: persona.id_usuario },
        ...(i % 2 === 0
          ? [{ id_usuario: persona.id_usuario, titulo: 'Doctorado en Ciencias de la Educación', institucion: 'Universidad del Cauca', nivel: 'doctorado', anio_inicio: 2021, anio_fin: null, created_by: persona.id_usuario }]
          : []),
      ],
    });
    profesores.push({ ...persona, escuela: p.escuela });
  }
  const profesoresDe = (e: ClaveEscuela) => profesores.filter((p) => p.escuela === e);

  // ---------------- Estudiantes (6 por escuela)
  const fijos: { email: string; nombres: string; apellidos: string; escuela: ClaveEscuela; avisoPendiente?: boolean }[] = [
    { email: 'estudiante1@unilab.edu', nombres: 'Sofía', apellidos: 'Estudiante', escuela: 'software' },
    { email: 'estudiante2@unilab.edu', nombres: 'Diego', apellidos: 'Estudiante', escuela: 'ingenieria', avisoPendiente: true },
    { email: 'estudiante3@unilab.edu', nombres: 'Valentina', apellidos: 'Estudiante', escuela: 'negocios' },
  ];
  const estudiantesDef = [...fijos];
  let n = 4;
  for (const e of ESCUELAS) {
    while (estudiantesDef.filter((x) => x.escuela === e.clave).length < 6) {
      const mujer = n % 2 === 0;
      estudiantesDef.push({
        email: `estudiante${n}@unilab.edu`,
        nombres: rnd.elegir(mujer ? NOMBRES_F : NOMBRES_M),
        apellidos: `${rnd.elegir(APELLIDOS)} ${rnd.elegir(APELLIDOS)}`,
        escuela: e.clave,
      });
      n += 1;
    }
  }
  const estudiantes: Persona[] = [];
  for (const [i, e] of estudiantesDef.entries()) {
    const esc = ESCUELAS.find((x) => x.clave === e.escuela)!;
    const semestre = rnd.entre(4, 10);
    const conPerfil = !e.avisoPendiente && (i < 3 || rnd.prob(0.85));
    const persona = await crearUsuario({
      rol: 'Estudiante',
      nombres: e.nombres,
      apellidos: e.apellidos,
      email: e.email,
      created_by: A,
      perfil_cv_revisado: !e.avisoPendiente,
      sinFoto: !conPerfil,
      cv: conPerfil
        ? {
            titular: `Estudiante de ${PROGRAMA_TITULAR[e.escuela]} · ${semestre}.º semestre`,
            biografia: `Estudiante de la ${esc.nombre}. Me interesa ${rnd.elegir(['investigar', 'construir soluciones', 'aprender haciendo', 'trabajar con comunidades'])} y aportar al desarrollo del Cauca desde mi carrera.`,
            especialidades: rnd.varios(ESPECIALIDADES[e.escuela], rnd.entre(2, 4)),
            fortalezas: rnd.varios(FORTALEZAS, rnd.entre(2, 3)),
            url_linkedin: `https://www.linkedin.com/in/${slug(`${e.nombres} ${e.apellidos}`)}-${i}`,
            ...(e.escuela === 'software' ? { url_github: `https://github.com/${slug(e.nombres)}${i}` } : {}),
            mostrar_telefono: i === 0,
          }
        : undefined,
    });
    await prisma.perfiles_estudiante.create({
      data: { id_usuario: persona.id_usuario, codigo_estudiantil: `EST-${String(i + 1).padStart(3, '0')}`, id_escuela: escuelaId[e.escuela], created_by: A },
    });
    if (conPerfil) {
      await prisma.usuario_formacion.createMany({
        data: [
          { id_usuario: persona.id_usuario, titulo: PROGRAMA_TITULAR[e.escuela], institucion: 'Corporación Universitaria Autónoma del Cauca', nivel: 'pregrado', anio_inicio: 2026 - Math.ceil(semestre / 2), anio_fin: null, created_by: persona.id_usuario },
          ...(rnd.prob(0.5)
            ? [{ id_usuario: persona.id_usuario, titulo: rnd.elegir(['Curso de Inglés B1', 'Diplomado en Innovación Social', 'Curso de Python para Datos', 'Certificación en Primeros Auxilios']), institucion: rnd.elegir(['SENA', 'Platzi', 'Cruz Roja Colombiana', 'Coursera']), nivel: 'curso', anio_inicio: 2025, anio_fin: 2025, created_by: persona.id_usuario }]
            : []),
        ],
      });
    }
    estudiantes.push({ ...persona, escuela: e.escuela });
  }
  const estudiantesDe = (e: ClaveEscuela) => estudiantes.filter((x) => x.escuela === e);

  // ---------------- Externos
  const externosDef = [
    { email: 'externo@unilab.edu', nombres: 'Pedro', apellidos: 'Externo', institucion: 'Empresa Aliada S.A.S.', ocupacion: 'Desarrollador de software' },
    { email: 'externo2@unilab.edu', nombres: 'Mónica', apellidos: 'Guevara Paz', institucion: 'Fundación Cauca Digital', ocupacion: 'Directora de proyectos' },
    { email: 'externo3@unilab.edu', nombres: 'Andrés', apellidos: 'Ramírez Daza', institucion: 'Cámara de Comercio del Cauca', ocupacion: 'Analista de emprendimiento' },
  ];
  const externos: Persona[] = [];
  for (const x of externosDef) {
    const persona = await crearUsuario({
      rol: 'Externo',
      nombres: x.nombres,
      apellidos: x.apellidos,
      email: x.email,
      created_by: A,
      cv: { titular: `${x.ocupacion} · ${x.institucion}` },
    });
    await prisma.perfiles_externo.create({ data: { id_usuario: persona.id_usuario, institucion: x.institucion, ocupacion: x.ocupacion, created_by: A } });
    externos.push(persona);
  }

  // ---------------- Semilleros y proyectos
  const ESTADOS_EXTRA: { estado: string; cantidad: number }[] = [
    { estado: 'en_revision', cantidad: 4 },
    { estado: 'borrador', cantidad: 3 },
    { estado: 'rechazado', cantidad: 2 },
  ];
  let proyectosPublicados = 0;
  const proyectosCreados: { id_proyecto: number; escuela: ClaveEscuela; publicado: boolean }[] = [];
  const usadosPorEscuela: Record<ClaveEscuela, number> = { derecho: 0, educacion: 0, ingenieria: 0, negocios: 0, software: 0 };
  /** Las imágenes rotan dentro de cada temática: proyectos distintos no comparten la foto principal. */
  const usoTema: Partial<Record<Tema, number>> = {};
  const imagenesDe = (tema: Tema, cantidad: number) => {
    const lista = IMG[tema];
    const inicio = usoTema[tema] ?? 0;
    usoTema[tema] = inicio + 1;
    return Array.from({ length: Math.min(cantidad, lista.length) }, (_, i) => lista[(inicio + i) % lista.length]);
  };

  const crearProyecto = async (def: ProyectoDef, ctx: {
    escuela: ClaveEscuela;
    id_semillero?: number;
    creador: Persona;
    coautores: Persona[];
    director: Persona;
    estado: string;
    diasAtras: number;
  }) => {
    const curso = cursoDe(ctx.escuela, def.curso);
    const imagenes = imagenesDe(def.tema, rnd.entre(2, 3));
    const busqueda = encodeURIComponent(def.titulo);
    const publicado = ctx.estado === 'publicado';
    const fechaPub = new Date(Date.UTC(2026, 10, 10) - ctx.diasAtras * 86400000);
    const p = await prisma.proyectos.create({
      data: {
        id_curso: curso.id_curso,
        id_semillero: ctx.id_semillero,
        id_estudiante_creador: ctx.creador.id_usuario,
        titulo: def.titulo,
        descripcion: def.descripcion,
        tipo_proyecto: def.tipo,
        url_aplicativo: def.tipo === 'podcast' ? `https://www.youtube.com/results?search_query=${busqueda}` : `https://github.com/search?q=${slug(def.titulo)}`,
        url_imagen: img(imagenes[0]),
        url_apk: def.tipo === 'movil' ? `https://github.com/search?q=${slug(def.titulo)}+apk` : null,
        url_youtube: `https://www.youtube.com/results?search_query=${busqueda}`,
        url_spotify: def.tipo === 'podcast' ? `https://open.spotify.com/search/${busqueda}` : null,
        estado_proyecto: ctx.estado,
        id_aprobador: publicado ? ctx.director.id_usuario : null,
        fecha_publicacion: publicado ? fechaPub : null,
        contador_vistas: publicado ? rnd.entre(18, 420) : rnd.entre(0, 6),
        created_by: ctx.creador.id_usuario,
      },
    });
    await prisma.proyecto_imagenes.createMany({
      data: imagenes.map((id, i) => ({
        id_proyecto: p.id_proyecto,
        ruta_archivo: img(id),
        nombre_original: `${slug(def.titulo)}-${i + 1}.jpg`,
        mime_type: 'image/jpeg',
        orden: i + 1,
        created_by: ctx.creador.id_usuario,
      })),
    });
    await prisma.proyecto_coordinadores.create({ data: { id_proyecto: p.id_proyecto, id_profesor: ctx.director.id_usuario, created_by: A } });
    await prisma.proyecto_autores.createMany({
      data: [
        { id_proyecto: p.id_proyecto, id_estudiante: ctx.creador.id_usuario, rol_autor: 'principal', created_by: ctx.creador.id_usuario },
        ...ctx.coautores.map((c) => ({ id_proyecto: p.id_proyecto, id_estudiante: c.id_usuario, rol_autor: 'coautor', created_by: ctx.creador.id_usuario })),
      ],
    });

    if (publicado) {
      proyectosPublicados += 1;
      // Calificaciones: algunos proyectos sin votos, otros con varios (da variedad al ranking)
      if (rnd.prob(0.8)) {
        const votantes = rnd.varios([...estudiantes, ...profesores, ...externos].filter((u) => u.id_usuario !== ctx.creador.id_usuario), rnd.entre(2, 9));
        const base = rnd.entre(3, 5);
        await prisma.calificaciones.createMany({
          data: votantes.map((v) => ({
            id_proyecto: p.id_proyecto,
            id_usuario: v.id_usuario,
            puntuacion: Math.max(1, Math.min(5, base + rnd.entre(-1, 1))),
            created_by: v.id_usuario,
          })),
        });
      }
      // Comentarios con alguna respuesta del autor
      for (let c = 0; c < rnd.entre(0, 3); c += 1) {
        const autor = rnd.elegir([...profesores, ...estudiantes, ...externos]);
        const comentario = await prisma.comentarios.create({
          data: {
            id_proyecto: p.id_proyecto,
            id_usuario: autor.id_usuario,
            contenido: rnd.elegir(COMENTARIOS),
            fecha_comentario: new Date(fechaPub.getTime() + rnd.entre(1, 20) * 86400000),
            created_by: autor.id_usuario,
          },
        });
        if (rnd.prob(0.4)) {
          await prisma.comentarios.create({
            data: {
              id_proyecto: p.id_proyecto,
              id_usuario: ctx.creador.id_usuario,
              id_comentario_padre: comentario.id_comentario,
              contenido: rnd.elegir(RESPUESTAS),
              fecha_comentario: new Date(comentario.fecha_comentario.getTime() + 86400000),
              created_by: ctx.creador.id_usuario,
            },
          });
        }
      }
    }
    proyectosCreados.push({ id_proyecto: p.id_proyecto, escuela: ctx.escuela, publicado });
    return p;
  };

  const resumenSemilleros: string[] = [];
  for (const [si, s] of SEMILLEROS.entries()) {
    const [profA, profB] = profesoresDe(s.escuela);
    const esInnovacion = s.nombre === 'Semillero de Innovación Tecnológica';
    const lider = esInnovacion ? profesores[0] : si % 2 === 0 ? profA : profB;
    const otro = lider.id_usuario === profA.id_usuario ? profB : profA;
    const sem = await prisma.semilleros.create({
      data: {
        nombre_semillero: s.nombre,
        descripcion: s.descripcion,
        id_escuela: escuelaId[s.escuela],
        id_profesor_lider: lider.id_usuario,
        url_foto_portada: img(IMG[s.tema][si % IMG[s.tema].length]),
        activo: true,
        created_by: A,
      },
    });
    await prisma.semillero_profesores.createMany({
      data: [
        { id_semillero: sem.id_semillero, id_profesor: lider.id_usuario, es_lider: true, rol: 'lider', fecha_asignacion: fecha('2026-01-20'), created_by: A },
        // En la mitad de los semilleros el segundo profesor es coordinador; en la otra, acompañante
        { id_semillero: sem.id_semillero, id_profesor: otro.id_usuario, es_lider: false, rol: si % 2 === 0 ? 'coordinador' : 'acompanante', fecha_asignacion: fecha('2026-02-05'), created_by: A },
      ],
    });
    await prisma.semillero_evidencias.createMany({
      data: [...IMG.equipo.slice(si % 3, (si % 3) + 2), IMG[s.tema][(si + 1) % IMG[s.tema].length]].map((id, i) => ({
        id_semillero: sem.id_semillero,
        ruta_archivo: img(id),
        nombre_original: `evidencia-${slug(s.nombre)}-${i + 1}.jpg`,
        mime_type: 'image/jpeg',
        orden: i + 1,
        created_by: lider.id_usuario,
      })),
    });

    // Miembros: rotan entre los estudiantes de la escuela; Sofía pertenece al de Innovación
    const pool = estudiantesDe(s.escuela);
    const desplazamiento = usadosPorEscuela[s.escuela];
    usadosPorEscuela[s.escuela] += 2;
    const miembros = Array.from({ length: 4 }, (_, k) => pool[(desplazamiento + k) % pool.length]);
    if (esInnovacion && !miembros.some((m) => m.email === 'estudiante1@unilab.edu')) miembros[0] = pool.find((m) => m.email === 'estudiante1@unilab.edu')!;
    const unicos = miembros.filter((m, i) => miembros.findIndex((x) => x.id_usuario === m.id_usuario) === i);
    await prisma.semillero_miembros.createMany({
      data: unicos.map((m, k) => ({
        id_semillero: sem.id_semillero,
        id_estudiante: m.id_usuario,
        estado_solicitud: 'aprobado',
        // Un líder estudiantil por semillero y, en algunos, un coordinador estudiantil
        rol: k === 0 ? 'lider' : k === 1 && si % 3 === 0 ? 'coordinador' : 'integrante',
        puede_publicar: true,
        fecha_resolucion: fecha('2026-02-15'),
        fecha_autorizacion: fecha('2026-02-15'),
        id_profesor_autorizador: lider.id_usuario,
        created_by: m.id_usuario,
      })),
    });
    const pendiente = pool.find((m) => !unicos.some((u) => u.id_usuario === m.id_usuario));
    if (pendiente) {
      await prisma.semillero_miembros.create({
        data: { id_semillero: sem.id_semillero, id_estudiante: pendiente.id_usuario, estado_solicitud: 'pendiente', created_by: pendiente.id_usuario },
      });
    }

    for (const [pi, def] of s.proyectos.entries()) {
      const creador = unicos[pi % unicos.length];
      const coautores = rnd.varios(unicos.filter((m) => m.id_usuario !== creador.id_usuario), rnd.entre(1, 2));
      await crearProyecto(def, {
        escuela: s.escuela,
        id_semillero: sem.id_semillero,
        creador,
        coautores,
        director: rnd.prob(0.7) ? lider : otro,
        estado: 'publicado',
        diasAtras: rnd.entre(5, 260),
      });
    }
    resumenSemilleros.push(`${s.nombre} (${unicos.length} miembros, ${s.proyectos.length} proyectos)`);
  }

  for (const e of ESCUELAS) {
    for (const def of INDEPENDIENTES[e.clave]) {
      const pool = estudiantesDe(e.clave);
      const creador = rnd.elegir(pool);
      await crearProyecto(def, {
        escuela: e.clave,
        creador,
        coautores: rnd.varios(pool.filter((m) => m.id_usuario !== creador.id_usuario), rnd.entre(0, 1)),
        director: rnd.elegir(profesoresDe(e.clave)),
        estado: 'publicado',
        diasAtras: rnd.entre(5, 300),
      });
    }
  }

  // Proyectos en otros estados del flujo (revisión, borrador, rechazado) para probar el panel docente
  const enCurso: ProyectoDef[] = [
    { titulo: 'App de Reciclaje con Puntos', descripcion: 'Aplicación que premia con puntos canjeables la entrega de residuos separados en el campus.', tipo: 'movil', tema: 'ambiente', curso: 'Ambiental' },
    { titulo: 'Tablero de Asistencia Docente', descripcion: 'Visualización de la asistencia a clases para detectar alertas tempranas por curso.', tipo: 'web', tema: 'software', curso: 'Software' },
    { titulo: 'Huerta Escolar Hidropónica', descripcion: 'Montaje y guía de una huerta hidropónica para colegios urbanos sin espacio verde.', tipo: 'otro', tema: 'agro', curso: 'Energética' },
    { titulo: 'Simulador de Juicio Oral', descripcion: 'Entorno de práctica para audiencias orales con roles y guiones evaluables.', tipo: 'web', tema: 'derecho', curso: 'Derecho' },
    { titulo: 'Ferias de Emprendimiento Virtuales', descripcion: 'Plataforma para exhibir emprendimientos estudiantiles con estands virtuales.', tipo: 'web', tema: 'negocios', curso: 'Administración' },
    { titulo: 'Juegos Tradicionales Caucanos', descripcion: 'Recopilación de juegos tradicionales con fichas pedagógicas para educación física.', tipo: 'otro', tema: 'deporte', curso: 'Deportivo' },
    { titulo: 'Contador de Aforo con Visión Artificial', descripcion: 'Conteo anónimo de personas en espacios del campus para gestionar aforos.', tipo: 'otro', tema: 'ia', curso: 'Datos' },
    { titulo: 'Guía de Trámites Notariales', descripcion: 'Explicación sencilla de trámites notariales frecuentes con lista de requisitos.', tipo: 'web', tema: 'derecho', curso: 'Derecho' },
    { titulo: 'Cartilla de Ahorro Escolar', descripcion: 'Material didáctico sobre ahorro para niños de primaria con actividades en familia.', tipo: 'otro', tema: 'educacion', curso: 'Infantil' },
  ];
  const escuelasEnCurso: ClaveEscuela[] = ['software', 'software', 'ingenieria', 'derecho', 'negocios', 'educacion', 'software', 'derecho', 'educacion'];
  let k = 0;
  for (const { estado, cantidad } of ESTADOS_EXTRA) {
    for (let c = 0; c < cantidad; c += 1, k += 1) {
      const escuela = escuelasEnCurso[k];
      const creador = escuela === 'software' && k === 0 ? estudiantes[0] : rnd.elegir(estudiantesDe(escuela));
      await crearProyecto(enCurso[k], {
        escuela,
        creador,
        coautores: [],
        director: escuela === 'software' ? profesores[0] : rnd.elegir(profesoresDe(escuela)),
        estado,
        diasAtras: rnd.entre(1, 30),
      });
    }
  }

  // ---------------- Eventos con jornadas, inscripciones, asistencias y evidencias
  interface EventoDef {
    nombre: string;
    tipo: string;
    descripcion: string;
    inicio: string;
    fin: string;
    lugar: string;
    estado: 'planeado' | 'activo' | 'finalizado';
    requiere_pago: boolean;
    flyer: string;
    jornadas: { nombre: string; fecha: string; inicio: string; fin: string }[];
    inscritos: number;
    escuelas?: ClaveEscuela[];
  }
  const EVENTOS: EventoDef[] = [
    {
      nombre: 'Foro Universitario de Proyectos 2026', tipo: 'Foro académico',
      descripcion: 'Muestra de los mejores proyectos de aula y de semilleros de todas las escuelas, con jurados externos y premiación.',
      inicio: '2026-06-15', fin: '2026-06-16', lugar: 'Auditorio Principal — Campus Central', estado: 'finalizado', requiere_pago: false,
      flyer: IMG.eventos[0],
      jornadas: [
        { nombre: 'Día 1 · Jornada mañana', fecha: '2026-06-15', inicio: '08:00', fin: '12:00' },
        { nombre: 'Día 2 · Jornada tarde', fecha: '2026-06-16', inicio: '14:00', fin: '18:00' },
      ],
      inscritos: 24,
    },
    {
      nombre: 'Jornada Pedagógica: Aulas que Innovan', tipo: 'Taller',
      descripcion: 'Talleres prácticos sobre aprendizaje basado en proyectos y juego para docentes y estudiantes de licenciatura.',
      inicio: '2026-08-21', fin: '2026-08-21', lugar: 'Bloque de Educación — Aula Múltiple', estado: 'finalizado', requiere_pago: false,
      flyer: IMG.educacion[1],
      jornadas: [{ nombre: 'Jornada única', fecha: '2026-08-21', inicio: '08:00', fin: '13:00' }],
      inscritos: 14, escuelas: ['educacion'],
    },
    {
      nombre: 'Semana de la Ciencia y la Innovación', tipo: 'Congreso',
      descripcion: 'Conferencias, ponencias de semilleros y feria de prototipos con invitados nacionales.',
      inicio: '2026-09-22', fin: '2026-09-24', lugar: 'Centro de Convenciones Uniautónoma', estado: 'finalizado', requiere_pago: false,
      flyer: IMG.eventos[1],
      jornadas: [
        { nombre: 'Día 1 · Conferencias', fecha: '2026-09-22', inicio: '08:00', fin: '12:00' },
        { nombre: 'Día 2 · Ponencias de semilleros', fecha: '2026-09-23', inicio: '08:00', fin: '12:00' },
        { nombre: 'Día 3 · Feria de prototipos', fecha: '2026-09-24', inicio: '14:00', fin: '18:00' },
      ],
      inscritos: 28,
    },
    {
      nombre: 'Torneo Deportivo Interescuelas', tipo: 'Encuentro deportivo',
      descripcion: 'Fútbol sala, baloncesto y voleibol mixto entre escuelas para promover la convivencia universitaria.',
      inicio: '2026-10-09', fin: '2026-10-10', lugar: 'Coliseo Universitario', estado: 'finalizado', requiere_pago: false,
      flyer: IMG.deporte[0],
      jornadas: [
        { nombre: 'Fase de grupos', fecha: '2026-10-09', inicio: '07:00', fin: '13:00' },
        { nombre: 'Finales y premiación', fecha: '2026-10-10', inicio: '08:00', fin: '12:00' },
      ],
      inscritos: 18,
    },
    {
      nombre: 'Hackathon Cauca Inteligente', tipo: 'Hackathon',
      descripcion: '24 horas para construir soluciones con datos abiertos a retos de movilidad, agua y agro planteados por entidades del departamento.',
      inicio: '2026-11-14', fin: '2026-11-20', lugar: 'Laboratorio de Software — Bloque B', estado: 'activo', requiere_pago: false,
      flyer: IMG.software[8],
      jornadas: [
        { nombre: 'Lanzamiento de retos', fecha: '2026-11-14', inicio: '08:00', fin: '12:00' },
        { nombre: 'Demo day', fecha: '2026-11-20', inicio: '14:00', fin: '18:00' },
      ],
      inscritos: 16, escuelas: ['software', 'ingenieria'],
    },
    {
      nombre: 'Congreso de Derecho y Tecnología', tipo: 'Congreso',
      descripcion: 'Protección de datos, inteligencia artificial y justicia digital: panel con magistrados, abogados y empresas tecnológicas.',
      inicio: '2026-12-03', fin: '2026-12-04', lugar: 'Auditorio de Derecho', estado: 'planeado', requiere_pago: true,
      flyer: IMG.derecho[0],
      jornadas: [
        { nombre: 'Día 1 · Paneles', fecha: '2026-12-03', inicio: '08:00', fin: '12:00' },
        { nombre: 'Día 2 · Talleres', fecha: '2026-12-04', inicio: '08:00', fin: '12:00' },
      ],
      inscritos: 10, escuelas: ['derecho'],
    },
    {
      nombre: 'Feria de Emprendimiento Universitario', tipo: 'Feria',
      descripcion: 'Exhibición y rueda de negocios de emprendimientos estudiantiles con mentores de la Cámara de Comercio.',
      inicio: '2027-02-18', fin: '2027-02-18', lugar: 'Plazoleta Central', estado: 'planeado', requiere_pago: false,
      flyer: IMG.negocios[3],
      jornadas: [{ nombre: 'Jornada única', fecha: '2027-02-18', inicio: '09:00', fin: '17:00' }],
      inscritos: 8, escuelas: ['negocios'],
    },
  ];

  let totalAsistencias = 0;
  for (const [ei, ev] of EVENTOS.entries()) {
    const evento = await prisma.eventos.create({
      data: {
        nombre_evento: ev.nombre,
        tipo_evento: ev.tipo,
        descripcion: ev.descripcion,
        fecha_inicio: fecha(ev.inicio),
        fecha_fin: fecha(ev.fin),
        lugar: ev.lugar,
        id_organizador: A,
        estado: ev.estado,
        requiere_pago: ev.requiere_pago,
        url_flyer: img(ev.flyer, 1400),
        created_by: A,
      },
    });
    const jornadas: { id_jornada: number; registro: Date }[] = [];
    for (const j of ev.jornadas) {
      const creada = await prisma.evento_jornadas.create({
        data: { id_evento: evento.id_evento, nombre_jornada: j.nombre, fecha: fecha(j.fecha), hora_inicio: hora(j.inicio), hora_fin: hora(j.fin), codigo_qr: randomUUID(), created_by: A },
      });
      // Los asistentes llegan en los primeros minutos de la jornada
      jornadas.push({ id_jornada: creada.id_jornada, registro: new Date(`${j.fecha}T${j.inicio}:00`) });
    }

    // Inscritos: estudiantes (de las escuelas del evento si aplica), algún docente y un externo
    const candidatos = ev.escuelas ? estudiantes.filter((e) => ev.escuelas!.includes(e.escuela!)) : estudiantes;
    const elegidos = [
      ...(ei === 0 ? [estudiantes[0]] : []),
      ...rnd.varios(candidatos.filter((c) => !(ei === 0 && c.id_usuario === estudiantes[0].id_usuario)), Math.min(ev.inscritos, candidatos.length)),
    ];
    const asistentes: { persona: Persona; tipo: string }[] = [
      ...elegidos.map((p) => ({ persona: p, tipo: 'estudiante' })),
      ...rnd.varios(profesores, 2).map((p) => ({ persona: p, tipo: 'docente' })),
      { persona: externos[ei % externos.length], tipo: 'externo' },
    ];
    for (const { persona, tipo } of asistentes) {
      const insc = await prisma.inscripciones.create({
        data: {
          id_evento: evento.id_evento,
          id_usuario: persona.id_usuario,
          tipo_asistente: tipo,
          nombre_completo: `${persona.nombres} ${persona.apellidos}`,
          documento_identidad: persona.documento,
          email: persona.email,
          telefono: persona.telefono,
          institucion: tipo === 'externo' ? 'Institución aliada' : 'Corporación Universitaria Autónoma del Cauca',
          genero: rnd.elegir(['femenino', 'masculino', 'femenino', 'masculino', 'otro']),
          estado_pago: ev.requiere_pago ? rnd.elegir(['confirmado', 'confirmado', 'pendiente']) : null,
          created_by: persona.id_usuario,
        },
      });
      // Asistencia: en eventos finalizados la mayoría asistió; en el activo, solo a la primera jornada
      if (ev.estado === 'planeado') continue;
      const jornadasAsistidas = ev.estado === 'activo' ? jornadas.slice(0, 1) : jornadas.filter(() => rnd.prob(0.85));
      for (const j of jornadasAsistidas) {
        await prisma.asistencias.create({
          data: {
            id_inscripcion: insc.id_inscripcion,
            id_jornada: j.id_jornada,
            fecha_hora_registro: new Date(j.registro.getTime() + rnd.entre(0, 25) * 60000),
            created_by: persona.id_usuario,
          },
        });
        totalAsistencias += 1;
      }
    }

    // Evidencias fotográficas en las jornadas ya realizadas
    if (ev.estado !== 'planeado') {
      for (const j of ev.estado === 'activo' ? jornadas.slice(0, 1) : jornadas) {
        await prisma.evento_jornada_evidencias.createMany({
          data: rnd.varios([...IMG.eventos, ...IMG.equipo, ...IMG.campus], 3).map((id, i) => ({
            id_jornada: j.id_jornada,
            ruta_archivo: img(id),
            nombre_original: `evidencia-${slug(ev.nombre)}-${i + 1}.jpg`,
            mime_type: 'image/jpeg',
            orden: i + 1,
            created_by: A,
          })),
        });
      }
    }
  }

  // ---------------- Resumen
  const [usuarios, cursos, proyectos, calificaciones, comentarios, inscripciones] = await Promise.all([
    prisma.usuarios.count(),
    prisma.cursos.count(),
    prisma.proyectos.count(),
    prisma.calificaciones.count(),
    prisma.comentarios.count(),
    prisma.inscripciones.count(),
  ]);
  console.log('Seed completado.');
  console.log(`  Usuarios: ${usuarios} (1 admin, 2 coordinadores, ${profesores.length} profesores, ${estudiantes.length} estudiantes, ${externos.length} externos)`);
  console.log(`  Escuelas: ${ESCUELAS.length} · Cursos: ${cursos}`);
  console.log(`  Semilleros: ${SEMILLEROS.length}`);
  resumenSemilleros.forEach((r) => console.log(`    - ${r}`));
  console.log(`  Proyectos: ${proyectos} (${proyectosPublicados} publicados)`);
  console.log(`  Calificaciones: ${calificaciones} · Comentarios: ${comentarios}`);
  console.log(`  Eventos: ${EVENTOS.length} · Inscripciones: ${inscripciones} · Asistencias: ${totalAsistencias}`);
  console.log(`  Contraseña de todas las cuentas: ${PASSWORD_PLAIN}`);
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
