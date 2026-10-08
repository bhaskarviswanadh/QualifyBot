import { Router } from 'express';
import { botService } from '../services/botService.js';

const router = Router();

router.post('/sync', async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    const result = await botService.syncCrm(sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
