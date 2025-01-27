import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  console.log('GET /health -> Status: 200');
  res.status(200).json({ status: 'UP', time: new Date().toISOString() });
});

export default healthRouter;
