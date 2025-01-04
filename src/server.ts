import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import v1Router from '@/routes/v1';
import { defaultController } from '@/controllers/';
import healthRouter from './routes/health';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', defaultController);

app.use('/health', healthRouter);
app.use('/api/v1', v1Router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
