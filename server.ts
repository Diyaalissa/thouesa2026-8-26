import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/auth';
import { shipmentsRouter } from './server/routes/shipments';
import { tripsRouter } from './server/routes/trips';
import { hubsRouter } from './server/routes/hubs';
import { escrowRouter } from './server/routes/escrow';
import { adminRouter } from './server/routes/admin';
import { cronRouter } from './server/routes/cron';
import { manifestsRouter } from './server/routes/manifests';
import { usersRouter } from './server/routes/users';
import { notificationsRouter } from './server/routes/notifications';
import { ratesRouter } from './server/routes/rates';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser & URL Encoding
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'THOUESA P2P Logistics & Escrow API',
      timestamp: new Date().toISOString(),
      cPanelCompatible: true,
      engine: 'Modular Monolith (Express + Node.js)',
    });
  });

  // Mount Domain API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/shipments', shipmentsRouter);
  app.use('/api/trips', tripsRouter);
  app.use('/api/hubs', hubsRouter);
  app.use('/api/manifests', manifestsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/escrow', escrowRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/cron', cronRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/rates', ratesRouter);

  // Catch-all 404 for unhandled API routes (ensures JSON response instead of HTML)
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  // Global Error Handler for API
  app.use('/api/*', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  });

  // Vite middleware for development vs static build serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[THOUESA] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start THOUESA server:', err);
});
