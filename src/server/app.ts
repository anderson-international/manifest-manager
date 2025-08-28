import express, { Request, Response } from 'express';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import ordersRouter from './routes/orders';
import manifestRouter from './routes/manifest';
import mintsoftHealthRouter from './routes/mintsoft-health';

const app = express();

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (_req: Request, res: Response) => res.redirect('/orders'));
app.use('/', ordersRouter);
app.use('/', manifestRouter);
app.use('/', mintsoftHealthRouter);

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Server started');
});
