#!/bin/sh
set -e

echo "Aplicando migraciones de Prisma..."
until npx prisma migrate deploy; do
  echo "Base de datos no disponible, reintentando en 3s..."
  sleep 3
done

echo "Migraciones aplicadas."
exec "$@"
