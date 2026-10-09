import { Router } from 'express';
import { loginUser, registerUser } from '../services/authService.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const user = await registerUser({ email, password, name });
    res.status(201).json({ user });
  } catch (err) {
    const status = /already exists|required|at least/i.test(err.message) ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await loginUser({ email, password });
    res.json({ user });
  } catch (err) {
    const status = /Invalid|required/i.test(err.message) ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

export default router;
