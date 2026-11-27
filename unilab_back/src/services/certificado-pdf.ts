import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

const ASSETS = path.join(process.cwd(), 'assets', 'certificados');
const AZUL = '#053686';
const AZUL_OSCURO = '#032a6a';
const AMARILLO = '#e3c924';
const TINTA = '#1e1e1e';
const GRIS = '#555555';
const CREMA = '#fffdf5';

export interface DatosCertificadoPdf {
  nombre_completo: string;
  documento_identidad: string;
  nombre_evento: string;
  tipo_evento: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  lugar: string;
  jornadas_asistidas: number;
  jornadas_totales: number;
  porcentaje_asistencia: number;
  fecha_emision: Date;
  codigo_verificacion: string;
  organizador: string;
  /** Ruta absoluta de la imagen de la firma, si el organizador la registró. */
  firma_archivo: string | null;
  url_verificacion: string;
}

/** Las fechas de los eventos se guardan como DATE (medianoche UTC). */
function fecha(d: Date): string {
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function periodo(inicio: Date, fin: Date): string {
  return inicio.getTime() === fin.getTime() ? `el ${fecha(inicio)}` : `del ${fecha(inicio)} al ${fecha(fin)}`;
}

function asset(nombre: string): string | null {
  const ruta = path.join(ASSETS, nombre);
  return fs.existsSync(ruta) ? ruta : null;
}

/** Diploma horizontal A4 con logos, datos del asistente, firma del organizador y QR de verificación. */
export async function generarCertificadoPdf(d: DatosCertificadoPdf): Promise<Buffer> {
  const qr = await QRCode.toBuffer(d.url_verificacion, { margin: 0, width: 300, color: { dark: AZUL_OSCURO } });

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: { Title: `Certificado · ${d.nombre_evento}`, Author: 'Eduinnova', Subject: d.nombre_completo },
  });
  const partes: Buffer[] = [];
  doc.on('data', (b: Buffer) => partes.push(b));
  const fin = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(partes))));

  const W = doc.page.width;
  const H = doc.page.height;

  // Fondo y marcos
  doc.rect(0, 0, W, H).fill(CREMA);
  doc.rect(0, 0, W, 14).fill(AZUL);
  doc.rect(W * 0.72, 0, W * 0.28, 14).fill(AMARILLO);
  doc.rect(0, H - 14, W, 14).fill(AZUL);
  doc.rect(0, H - 14, W * 0.28, 14).fill(AMARILLO);
  doc.lineWidth(1.5).rect(28, 34, W - 56, H - 68).stroke(AZUL);
  doc.lineWidth(0.5).rect(34, 40, W - 68, H - 80).stroke(AMARILLO);

  // Logos
  const logo = asset('logo-eduinnova.png');
  const nombre = asset('nombre-eduinnova.png');
  const uni = asset('logo-uniautonoma.png');
  if (logo) doc.image(logo, 60, 58, { height: 62 });
  if (nombre) doc.image(nombre, 112, 76, { height: 26 });
  if (uni) doc.image(uni, W - 60 - 60, 58, { height: 62 });

  // Encabezado
  doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(30)
    .text('CERTIFICADO DE ASISTENCIA', 0, 140, { align: 'center', width: W, characterSpacing: 1.5 });
  doc.rect(W / 2 - 40, 180, 80, 3).fill(AMARILLO);

  doc.fillColor(GRIS).font('Helvetica').fontSize(12)
    .text('La Corporación Universitaria Autónoma del Cauca, a través de Eduinnova, certifica que', 80, 200, {
      align: 'center', width: W - 160,
    });

  // Asistente
  doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(28)
    .text(d.nombre_completo.toUpperCase(), 80, 226, { align: 'center', width: W - 160 });
  const yNombre = doc.y + 4;
  doc.fillColor(GRIS).font('Helvetica').fontSize(12)
    .text(`identificado(a) con documento de identidad No. ${d.documento_identidad}`, 80, yNombre, {
      align: 'center', width: W - 160,
    });

  // Evento (líneas separadas: pdfkit no centra bien un párrafo con estilos mezclados)
  const centrado = { align: 'center' as const, width: W - 220 };
  doc.fillColor(TINTA).font('Helvetica').fontSize(12.5).text('asistió al evento', 110, doc.y + 12, centrado);
  doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(18).text(d.nombre_evento, 110, doc.y + 4, centrado);
  doc.fillColor(TINTA).font('Helvetica').fontSize(12)
    .text(`${d.tipo_evento} · realizado ${periodo(d.fecha_inicio, d.fecha_fin)} · ${d.lugar}`, 110, doc.y + 4, centrado);
  doc.fillColor(GRIS).font('Helvetica').fontSize(11)
    .text(
      `con una asistencia de ${d.jornadas_asistidas} de ${d.jornadas_totales} jornada(s) (${d.porcentaje_asistencia} %)`,
      110,
      doc.y + 3,
      centrado,
    );

  // Firma del organizador
  const yFirma = H - 150;
  const xFirma = 110;
  const anchoFirma = 220;
  if (d.firma_archivo && fs.existsSync(d.firma_archivo)) {
    doc.image(d.firma_archivo, xFirma + 30, yFirma - 52, { fit: [anchoFirma - 60, 50], align: 'center', valign: 'bottom' });
  }
  doc.lineWidth(1).moveTo(xFirma, yFirma).lineTo(xFirma + anchoFirma, yFirma).stroke(TINTA);
  doc.fillColor(TINTA).font('Helvetica-Bold').fontSize(11)
    .text(d.organizador, xFirma, yFirma + 6, { width: anchoFirma, align: 'center' });
  doc.fillColor(GRIS).font('Helvetica').fontSize(9.5)
    .text('Organizador(a) del evento', xFirma, doc.y + 1, { width: anchoFirma, align: 'center' });

  // Fecha de emisión
  doc.fillColor(GRIS).font('Helvetica').fontSize(9.5)
    .text(`Expedido el ${fecha(d.fecha_emision)}`, W / 2 - 100, yFirma + 6, { width: 200, align: 'center' });

  // Verificación
  const tamQr = 86;
  const xQr = W - 110 - tamQr;
  doc.image(qr, xQr, yFirma - 62, { width: tamQr });
  doc.fillColor(GRIS).font('Helvetica').fontSize(7.5)
    .text('Verifique la autenticidad escaneando el código', xQr - 50, yFirma + 30, { width: tamQr + 100, align: 'center' });
  doc.fillColor(AZUL).font('Helvetica-Bold').fontSize(7.5)
    .text(d.codigo_verificacion, xQr - 50, doc.y + 1, { width: tamQr + 100, align: 'center' });

  doc.end();
  return fin;
}
