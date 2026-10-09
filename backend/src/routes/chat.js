import { Router } from 'express';
import { botService } from '../services/botService.js';

const router = Router();

function userKeyFrom(req) {
  const key = req.body?.userKey || req.query?.userKey || req.headers['x-user-key'];
  return String(key || 'guest').trim().toLowerCase() || 'guest';
}

router.post('/start', async (req, res) => {
  try {
    const result = await botService.startChat(userKeyFrom(req));
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
    const result = await botService.chat(
      sessionId,
      message.trim(),
      userKeyFrom(req)
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const items = await botService.listHistory(userKeyFrom(req));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history/:sessionId', async (req, res) => {
  try {
    const chat = await botService.getHistoryChat(
      req.params.sessionId,
      userKeyFrom(req)
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/history/:sessionId', async (req, res) => {
  try {
    const ok = await botService.deleteHistory(
      req.params.sessionId,
      userKeyFrom(req)
    );
    if (!ok) return res.status(404).json({ error: 'Chat not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:sessionId/summary', async (req, res) => {
  try {
    const result = await botService.getSummary(
      req.params.sessionId,
      userKeyFrom(req)
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
