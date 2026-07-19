import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { UPLOADS_ROOT } from './utils/uploadPaths';
import { buildCorsOptions } from './config/cors';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors(buildCorsOptions()));
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_ROOT));

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
