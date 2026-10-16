import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // Los tests son unitarios: los repositorios y Prisma se simulan, no requieren BD.
    env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/test' },
  },
});
