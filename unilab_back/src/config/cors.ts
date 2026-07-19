import type { CorsOptions } from 'cors';

const DEFAULT_ORIGINS = ['http://localhost:4200', 'http://localhost:8080'];

function parseOrigins(raw: string | undefined): string[] {
  if (!raw?.trim()) return DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const origins = parseOrigins(process.env.CORS_ORIGINS);

  return {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
