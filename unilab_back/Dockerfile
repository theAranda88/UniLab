FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY tsconfig.json ./

RUN npm install

COPY src ./src/

# Prisma 7 exige DATABASE_URL en generate; no conecta a la BD en build.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unilab?schema=public"
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY package.json prisma.config.ts ./
COPY prisma ./prisma/

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unilab?schema=public"
RUN npm install --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN sed -i 's/\r$//' /docker-entrypoint.sh \
  && chmod +x /docker-entrypoint.sh \
  && mkdir -p uploads

EXPOSE 3000

ENTRYPOINT ["dumb-init", "/docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
