# Capa de servicios

Los **services** contienen toda la lógica de negocio. Solo ellos llaman a `src/models/` (repositorios delgados sobre Prisma).

Los **controllers** delegan al service y devuelven la respuesta HTTP. Los **middlewares** validan forma de datos, JWT y roles — sin lógica de negocio.

Flujo: `route → validate → auth → rol → controller → service → repository → Prisma`
