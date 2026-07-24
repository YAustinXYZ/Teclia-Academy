import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import './loadEnv.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import statsRoutes from './routes/stats.js';
import paymentsRoutes from './routes/payments.js';
import webhooksRoutes from './routes/webhooks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(globalLimiter);

// Ensure a JWT secret exists for tests/development if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'teclia_dev_secret_change_this';
}

app.use(cors());
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRoutes);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.LOCAL_UPLOADS === 'true') {
  const localUploadsPath = path.join(__dirname, 'uploads');
  app.use('/uploads', express.static(localUploadsPath));
}

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments', paymentsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'Teclia Backend is running' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
