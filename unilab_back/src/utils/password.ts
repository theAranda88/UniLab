import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/** Genera contraseña aleatoria segura (12 caracteres alfanuméricos + símbolo). */
export function generarPasswordAleatoria(): string {
  const base = randomBytes(9).toString('base64url').slice(0, 10);
  return `${base}A1!`;
}

export async function hashearPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verificarPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
