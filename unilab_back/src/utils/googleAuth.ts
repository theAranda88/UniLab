import { OAuth2Client } from 'google-auth-library';
import { AppError } from './AppError';

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  hd?: string;
}

export function esEmailUniversitario(email: string): boolean {
  const domain = process.env.UNIVERSITY_EMAIL_DOMAIN ?? 'uniautonoma.edu.co';
  return email.toLowerCase().endsWith(`@${domain.toLowerCase()}`);
}

export async function verificarGoogleIdToken(credential: string): Promise<GoogleTokenPayload> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError('GOOGLE_CLIENT_ID no configurado', 500);
  }

  const client = new OAuth2Client(clientId);
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new AppError('Token Google inválido', 401);
    }
    if (!payload.email_verified) {
      throw new AppError('El correo de Google no está verificado', 401);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified,
      given_name: payload.given_name,
      family_name: payload.family_name,
      name: payload.name,
      hd: payload.hd,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Token Google inválido o expirado', 401);
  }
}

export function extraerNombresGoogle(payload: GoogleTokenPayload): { nombres: string; apellidos: string } {
  if (payload.given_name) {
    return {
      nombres: payload.given_name,
      apellidos: payload.family_name ?? '',
    };
  }
  if (payload.name) {
    const partes = payload.name.trim().split(/\s+/);
    if (partes.length === 1) {
      return { nombres: partes[0], apellidos: '' };
    }
    return {
      nombres: partes[0],
      apellidos: partes.slice(1).join(' '),
    };
  }
  const local = payload.email.split('@')[0] ?? 'Usuario';
  return { nombres: local, apellidos: '' };
}
