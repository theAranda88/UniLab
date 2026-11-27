import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  repo: {
    findEvento: vi.fn(),
    inscripcionesConAsistencias: vi.fn(),
    crearMuchos: vi.fn(),
    findById: vi.fn(),
    findByCodigo: vi.fn(),
    findPorEventoDocumento: vi.fn(),
    anular: vi.fn(),
  },
  config: { obtener: vi.fn() },
  pdf: vi.fn(),
}));

vi.mock('../src/models/certificado.repository', () => ({ certificadoRepository: m.repo }));
vi.mock('../src/services/configuracion.service', () => ({ configuracionService: m.config }));
vi.mock('../src/services/certificado-pdf', () => ({ generarCertificadoPdf: m.pdf }));

import { certificadoService, porcentaje } from '../src/services/certificado.service';

const admin = { id_usuario: 1, id_rol: 'Administrador', email: 'a@x', primer_login: false, perfil_pendiente: false };
const organizador = { ...admin, id_usuario: 4, id_rol: 'Profesor' };
const estudiante = { ...admin, id_usuario: 14, id_rol: 'Estudiante' };

const evento = {
  id_evento: 3,
  nombre_evento: 'Feria',
  tipo_evento: 'Feria',
  fecha_inicio: new Date('2026-11-01'),
  fecha_fin: new Date('2026-11-02'),
  lugar: 'Auditorio',
  id_organizador: 4,
  organizador: { id_usuario: 4, nombres: 'María', apellidos: 'Líder', firma_ruta: null },
  estado: 'finalizado',
  requiere_pago: false,
  _count: { jornadas: 4 },
};

function inscripcion(id: number, jornadas: number[], extra: Record<string, unknown> = {}) {
  return {
    id_inscripcion: id,
    id_usuario: null,
    nombre_completo: `Persona ${id}`,
    documento_identidad: `10${id}`,
    email: `p${id}@x.co`,
    tipo_asistente: 'estudiante',
    estado_pago: null,
    asistencias: jornadas.map((id_jornada) => ({ id_jornada })),
    certificados: [],
    ...extra,
  };
}

function certificado(extra: Record<string, unknown> = {}) {
  return {
    id_certificado: 9,
    codigo_verificacion: '3f1c2b9e-7a43-4d1e-9a3c-1f2e3d4c5b6a',
    nombre_completo: 'Sofía Estudiante',
    documento_identidad: '1002003004',
    nombre_evento: 'Feria',
    jornadas_asistidas: 4,
    jornadas_totales: 4,
    porcentaje_asistencia: 100,
    fecha_emision: new Date(),
    inscripcion: { id_inscripcion: 5, id_usuario: 14, email: 'Sofia@X.co', evento },
    ...extra,
  };
}

describe('certificadoService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.config.obtener.mockResolvedValue(80);
    m.repo.findEvento.mockResolvedValue(evento);
    m.pdf.mockResolvedValue(Buffer.from('pdf'));
  });

  it('redondea el porcentaje hacia abajo', () => {
    expect(porcentaje(3, 4)).toBe(75);
    expect(porcentaje(2, 3)).toBe(66);
    expect(porcentaje(0, 0)).toBe(0);
  });

  it('solo el administrador o el organizador ven el estado de certificados', async () => {
    await expect(certificadoService.resumenEvento(3, estudiante)).rejects.toMatchObject({ statusCode: 403 });
    m.repo.inscripcionesConAsistencias.mockResolvedValue([]);
    await expect(certificadoService.resumenEvento(3, organizador)).resolves.toMatchObject({ porcentaje_minimo: 80 });
  });

  it('emite solo a quienes cumplen el mínimo y aún no lo tienen; las asistencias repetidas cuentan una vez', async () => {
    m.repo.inscripcionesConAsistencias.mockResolvedValue([
      inscripcion(1, [1, 2, 3, 4]),
      inscripcion(2, [1, 2, 2, 3]), // 3 de 4 = 75 % < 80 %
      inscripcion(3, [1, 2, 3, 4], { certificados: [{ id_certificado: 7 }] }),
    ]);

    const r = await certificadoService.emitir(3, admin);

    expect(r).toEqual({ emitidos: 1, ya_emitidos: 1, no_cumplen: 1 });
    const creados = m.repo.crearMuchos.mock.calls[0][0];
    expect(creados).toHaveLength(1);
    expect(creados[0]).toMatchObject({ id_inscripcion: 1, porcentaje_asistencia: 100, jornadas_totales: 4, created_by: 1 });
  });

  it('exige pago confirmado o exento en eventos pagos', async () => {
    m.repo.findEvento.mockResolvedValue({ ...evento, requiere_pago: true });
    m.repo.inscripcionesConAsistencias.mockResolvedValue([
      inscripcion(1, [1, 2, 3, 4], { estado_pago: 'pendiente' }),
      inscripcion(2, [1, 2, 3, 4], { estado_pago: 'exento' }),
    ]);

    const r = await certificadoService.emitir(3, admin);
    expect(r.emitidos).toBe(1);
    expect(m.repo.crearMuchos.mock.calls[0][0][0].id_inscripcion).toBe(2);
  });

  it('no emite si el evento no está finalizado', async () => {
    m.repo.findEvento.mockResolvedValue({ ...evento, estado: 'activo' });
    m.repo.inscripcionesConAsistencias.mockResolvedValue([]);
    await expect(certificadoService.emitir(3, admin)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('el titular descarga su certificado, otro estudiante no', async () => {
    m.repo.findById.mockResolvedValue(certificado());
    await expect(certificadoService.pdfAutenticado(9, estudiante)).resolves.toMatchObject({
      archivo: 'certificado-feria-sofia-estudiante.pdf',
    });
    await expect(certificadoService.pdfAutenticado(9, { ...estudiante, id_usuario: 99 })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('la descarga pública exige que el correo coincida (sin importar mayúsculas)', async () => {
    m.repo.findPorEventoDocumento.mockResolvedValue(certificado());
    await expect(certificadoService.pdfPublico(3, '1002003004', 'sofia@x.co ')).resolves.toBeTruthy();
    await expect(certificadoService.pdfPublico(3, '1002003004', 'otro@x.co')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('la verificación pública oculta el documento', async () => {
    m.repo.findByCodigo.mockResolvedValue(certificado());
    const r = await certificadoService.verificar('3f1c2b9e-7a43-4d1e-9a3c-1f2e3d4c5b6a');
    expect(r.documento_identidad).toBe('••••••3004');
    expect(r.organizador).toBe('María Líder');
  });
});
