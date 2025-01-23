import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import v1Router from '@/routes/v1';
import healthRouter from './routes/health';
import { defaultController } from '@/controllers/';
import { setupSwagger } from './swagger';
import initWebSocket from './websocket';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', defaultController);

app.use('/health', healthRouter);
app.use('/api/v1', v1Router);

setupSwagger(app);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `Server is running on port ${chalk.magenta(`http://localhost:${PORT}`)}`
  );
  console.log(
    `Swagger is running on ${chalk.magentaBright(
      `http://localhost:${PORT}/api-docs`
    )}`
  );
});

export const wss = initWebSocket(server);
