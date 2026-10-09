import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { DATA_DIR, isAdminEmail } from '../config/settings.js';
import { isDbEnabled, query } from '../db/client.js';

const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
}

function readUsersFile() {
  ensureUsersFile();
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return { users: [] };
  }
}

function writeUsersFile(data) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

const ADMIN_LOGIN = 'admin';
const ADMIN_EMAIL = 'admin@qualifybot.com';
const ADMIN_PASSWORD = 'admin123';

function normalizeLogin(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (raw === ADMIN_LOGIN || raw === ADMIN_EMAIL) return ADMIN_EMAIL;
  return raw;
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name || null,
    userKey: `user:${row.id}`,
    isAdmin: isAdminEmail(row.email),
  };
}

/** Ensure default admin account exists (admin / admin123) */
export async function ensureAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const id = uuidv4();

  if (isDbEnabled()) {
    const { rows } = await query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [ADMIN_EMAIL]
    );
    if (rows[0]) {
      await query(
        `UPDATE users SET password_hash = $2, name = COALESCE(name, 'Admin') WHERE email = $1`,
        [ADMIN_EMAIL, passwordHash]
      );
      console.log('[auth] Admin ready — login: admin / admin123');
      return;
    }
    await query(
      `INSERT INTO users (id, email, name, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [id, ADMIN_EMAIL, 'Admin', passwordHash]
    );
    console.log('[auth] Admin created — login: admin / admin123');
    return;
  }

  const store = readUsersFile();
  const existing = store.users.find((u) => u.email === ADMIN_EMAIL);
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = existing.name || 'Admin';
  } else {
    store.users.push({
      id,
      email: ADMIN_EMAIL,
      name: 'Admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  }
  writeUsersFile(store);
  console.log('[auth] Admin ready — login: admin / admin123');
}

export async function registerUser({ email, password, name }) {
  const normalized = String(email || '').trim().toLowerCase();
  const pass = String(password || '');
  const displayName = String(name || '').trim() || null;

  if (!normalized || !normalized.includes('@')) {
    throw new Error('Valid email is required');
  }
  if (pass.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const passwordHash = await bcrypt.hash(pass, 10);
  const id = uuidv4();

  if (isDbEnabled()) {
    try {
      await query(
        `INSERT INTO users (id, email, name, password_hash)
         VALUES ($1, $2, $3, $4)`,
        [id, normalized, displayName, passwordHash]
      );
    } catch (err) {
      if (String(err.message).includes('duplicate') || err.code === '23505') {
        throw new Error('An account with this email already exists');
      }
      throw err;
    }
    return publicUser({ id, email: normalized, name: displayName });
  }

  const store = readUsersFile();
  if (store.users.some((u) => u.email === normalized)) {
    throw new Error('An account with this email already exists');
  }
  const user = {
    id,
    email: normalized,
    name: displayName,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  writeUsersFile(store);
  return publicUser(user);
}

export async function listUsers() {
  if (isDbEnabled()) {
    const { rows } = await query(
      `SELECT id, email, name, created_at FROM users ORDER BY created_at DESC`
    );
    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name || null,
      userKey: `user:${row.id}`,
      isAdmin: isAdminEmail(row.email),
      createdAt: row.created_at,
    }));
  }

  const store = readUsersFile();
  return store.users
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || null,
      userKey: `user:${u.id}`,
      isAdmin: isAdminEmail(u.email),
      createdAt: u.createdAt,
    }));
}

export async function loginUser({ email, password }) {
  const normalized = normalizeLogin(email);
  const pass = String(password || '');

  if (!normalized || !pass) {
    throw new Error('Email and password are required');
  }

  if (isDbEnabled()) {
    const { rows } = await query(
      `SELECT id, email, name, password_hash FROM users WHERE email = $1`,
      [normalized]
    );
    const row = rows[0];
    if (!row) throw new Error('Invalid email or password');
    const ok = await bcrypt.compare(pass, row.password_hash);
    if (!ok) throw new Error('Invalid email or password');
    return publicUser(row);
  }

  const store = readUsersFile();
  const user = store.users.find((u) => u.email === normalized);
  if (!user) throw new Error('Invalid email or password');
  const ok = await bcrypt.compare(pass, user.passwordHash);
  if (!ok) throw new Error('Invalid email or password');
  return publicUser(user);
}
