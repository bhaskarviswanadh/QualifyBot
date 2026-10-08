import express from 'express';
import cors from 'cors';
import { settings, getStatus } from './config/settings.js';
import { botService } from './services/botService.js';
import chatRoutes from './routes/chat.js';
import crmRoutes from './routes/crm.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: getStatus() });
});

app.use('/api/chat', chatRoutes);
app.use('/api/crm', crmRoutes);

async function start() {
  try {
    await botService.initialize();
  } catch (err) {
    console.error('[boot] RAG init warning:', err.message);
  }

  app.listen(settings.port, () => {
    console.log(`QualifyBot API listening on http://localhost:${settings.port}`);
    console.log('Status:', getStatus());
  });
}

start();
