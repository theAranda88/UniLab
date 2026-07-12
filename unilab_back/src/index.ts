import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const port = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servicio: 'UniLab API' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', routes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`UniLab API escuchando en http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});
