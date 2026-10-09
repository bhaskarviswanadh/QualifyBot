import express from 'express';
import cors from 'cors';
import { settings, getStatus } from './config/settings.js';
import { initDb, getDbMode } from './db/client.js';
import { botService } from './services/botService.js';
import { ensureAdminUser } from './services/authService.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import crmRoutes from './routes/crm.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: { ...getStatus(), database: getDbMode() },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/crm', crmRoutes);

async function start() {
  await initDb();

  try {
    await ensureAdminUser();
  } catch (err) {
    console.error('[boot] Admin seed warning:', err.message);
  }

  try {
    await botService.initialize();
  } catch (err) {
    console.error('[boot] RAG init warning:', err.message);
  }

  app.listen(settings.port, '0.0.0.0', () => {
    console.log(`QualifyBot API listening on http://0.0.0.0:${settings.port}`);
    console.log('Status:', { ...getStatus(), database: getDbMode() });
  });
}

start();
