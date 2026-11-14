import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { validateInput } from './middleware/input.middleware';
import { prisma } from './config/prisma';
import authRoutes from './modules/auth/auth.routes';
import skillswapRoutes from './modules/skillswap/skillswap.routes';
import todosRoutes from './modules/todos/todos.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import projectsRoutes from './modules/projects/projects.routes';
import resourcesRoutes from './modules/resources/resources.routes';
import resumeRoutes from './modules/resume/resume.routes';
import profileRoutes from './modules/profile/profile.routes';

export const app = express();
const production = process.env.NODE_ENV === 'production';
if (!process.env.DATABASE_URL || !process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) throw new Error('Set DATABASE_URL and a JWT_ACCESS_SECRET of at least 32 characters.');
app.disable('x-powered-by');
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',').map(v => v.trim());
app.use(cors({ origin(origin, callback) { callback(null, !origin || origins.includes(origin)); } }));
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'", "'wasm-unsafe-eval'", 'https://cdn.jsdelivr.net'],
  styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:', 'blob:'],
  connectSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://tessdata.projectnaptha.com'],
  workerSrc: ["'self'", 'blob:'], objectSrc: ["'none'"],
  upgradeInsecureRequests: production ? [] : null,
} }, crossOriginEmbedderPolicy: false, strictTransportSecurity: production ? undefined : false }));
app.use(compression());
app.use(express.json({ limit: '256kb' }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
const limitMessage = { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } };
app.use('/api', rateLimit({ windowMs: 60000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60000, limit: 30, skipSuccessfulRequests: true, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage }));
app.use('/api/v1/resume', rateLimit({ windowMs: 60000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: limitMessage }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ready' }); }
  catch { res.status(503).json({ status: 'unavailable' }); }
});
app.use('/api', (req, res, next) => {
  const ids = req.path.split('/').filter(p => /^[-+]?\d/.test(p));
  if (ids.some(v => !/^\d+$/.test(v) || !Number.isSafeInteger(Number(v)) || Number(v) < 1)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid resource ID' } });
  next();
});
app.use('/api', validateInput);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/skillswap', skillswapRoutes);
app.use('/api/v1/todos', todosRoutes);
app.use('/api/v1/events', calendarRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/resources', resourcesRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api', (_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint not found' } }));
const frontend = path.resolve(__dirname, '../../frontend/dist');
if (existsSync(frontend)) {
  app.use(express.static(frontend, { index: false, dotfiles: 'allow', setHeaders(res, file) { res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache'); } }));
  app.get('/{*page}', (req, res) => {
    if (path.extname(req.path)) return res.status(404).type('text').send('Not found');
    res.setHeader('Cache-Control', 'no-cache'); res.sendFile(path.join(frontend, 'index.html'));
  });
}
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') return res.status(err.status || 400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON or request too large' } });
  const status = err.code === 'P2002' || err.code === 'P2034' ? 409 : err.code === 'P2025' ? 404 : err.name === 'PrismaClientValidationError' ? 400 : 500;
  if (status === 500) console.error('Request failed', { name: err.name, code: err.code });
  res.status(status).json({ success: false, error: { code: status === 409 ? 'CONFLICT' : status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: status === 500 ? 'The request could not be completed.' : 'Invalid input, missing resource or conflicting operation.' } });
});
if (require.main === module) {
  const server = app.listen(Number(process.env.PORT || 5001), '0.0.0.0', () => console.log('CampusLink server listening'));
  let shuttingDown = false;
  const stop = () => {
    if (shuttingDown) return; shuttingDown = true;
    server.close(async () => { await prisma.$disconnect(); process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
