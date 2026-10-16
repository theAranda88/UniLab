import QRCode from 'qrcode';

/** Enlace que codifica el QR de una jornada: abre el registro de asistencia del evento. */
export function enlaceAsistencia(idEvento: number, codigoQr: string): string {
  return `${window.location.origin}/eventos/${idEvento}/asistencia?qr=${encodeURIComponent(codigoQr)}`;
}

/** Genera el QR de asistencia de una jornada como data URL (PNG, azul institucional). */
export function generarQrAsistencia(idEvento: number, codigoQr: string, width = 200): Promise<string> {
  return QRCode.toDataURL(enlaceAsistencia(idEvento, codigoQr), {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width,
    margin: 1,
    color: { dark: '#053686', light: '#FFFFFF' },
  });
}
