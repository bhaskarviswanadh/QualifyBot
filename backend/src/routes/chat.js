import { Router } from 'express';
import { botService } from '../services/botService.js';

const router = Router();

router.post('/start', (_req, res) => {
  try {
    const result = botService.startChat();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }
    const result = await botService.chat(sessionId, message.trim());
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:sessionId/summary', async (req, res) => {
  try {
    const result = await botService.getSummary(req.params.sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
