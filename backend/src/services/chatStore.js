import fs from 'fs';
import path from 'path';
import { DATA_DIR } from '../config/settings.js';
import { getPool, isDbEnabled, query } from '../db/client.js';

const FILE_PATH = path.join(DATA_DIR, 'chat_history.json');

function ensureFileStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({ chats: [] }, null, 2));
  }
}

function readFileStore() {
  ensureFileStore();
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return { chats: [] };
  }
}

function writeFileStore(data) {
  ensureFileStore();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

function previewTitle(messages) {
  const firstUser = (messages || []).find((m) => m.role === 'user');
  if (!firstUser?.content) return 'New chat';
  const text = firstUser.content.trim().replace(/\s+/g, ' ');
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export async function createChat({ id, userKey, greeting }) {
  const title = 'New chat';
  const history = [{ role: 'assistant', content: greeting }];
  const now = new Date().toISOString();

  if (isDbEnabled()) {
    await query(
      `INSERT INTO chats (id, user_key, title, lead_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())`,
      [id, userKey, title, null]
    );
    await query(
      `INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)`,
      [id, 'assistant', greeting]
    );
  } else {
    const store = readFileStore();
    store.chats.unshift({
      id,
      userKey,
      title,
      leadData: null,
      summary: null,
      history,
      createdAt: now,
      updatedAt: now,
    });
    writeFileStore(store);
  }

  return { id, userKey, title, history, leadData: null, summary: null };
}

export async function appendTurn({ chatId, userKey, userMessage, assistantReply, leadData }) {
  const titleHint = previewTitle([{ role: 'user', content: userMessage }]);

  if (isDbEnabled()) {
    await query(
      `INSERT INTO messages (chat_id, role, content) VALUES
         ($1, 'user', $2),
         ($1, 'assistant', $3)`,
      [chatId, userMessage, assistantReply]
    );
    await query(
      `UPDATE chats
       SET lead_data = COALESCE($2::jsonb, lead_data),
           title = CASE WHEN title = 'New chat' THEN $3 ELSE title END,
           updated_at = NOW()
       WHERE id = $1 AND user_key = $4`,
      [chatId, leadData ? JSON.stringify(leadData) : null, titleHint, userKey]
    );
    return;
  }

  const store = readFileStore();
  const chat = store.chats.find((c) => c.id === chatId && c.userKey === userKey);
  if (!chat) return;
  chat.history.push({ role: 'user', content: userMessage });
  chat.history.push({ role: 'assistant', content: assistantReply });
  if (leadData) chat.leadData = leadData;
  if (chat.title === 'New chat') chat.title = titleHint;
  chat.updatedAt = new Date().toISOString();
  writeFileStore(store);
}

export async function saveSummary({ chatId, userKey, summary, leadData }) {
  if (isDbEnabled()) {
    await query(
      `UPDATE chats
       SET summary = $2,
           lead_data = COALESCE($3::jsonb, lead_data),
           updated_at = NOW()
       WHERE id = $1 AND user_key = $4`,
      [chatId, summary, leadData ? JSON.stringify(leadData) : null, userKey]
    );
    return;
  }

  const store = readFileStore();
  const chat = store.chats.find((c) => c.id === chatId && c.userKey === userKey);
  if (!chat) return;
  chat.summary = summary;
  if (leadData) chat.leadData = leadData;
  chat.updatedAt = new Date().toISOString();
  writeFileStore(store);
}

export async function listChats(userKey, limit = 40) {
  if (isDbEnabled()) {
    const { rows } = await query(
      `SELECT id, title, lead_data, summary, created_at, updated_at,
              (SELECT content FROM messages m
               WHERE m.chat_id = c.id AND m.role = 'user'
               ORDER BY m.created_at ASC LIMIT 1) AS first_user_message
       FROM chats c
       WHERE user_key = $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userKey, limit]
    );
    return rows.map((r) => ({
      id: r.id,
      title: r.title || 'New chat',
      preview: r.first_user_message || 'No messages yet',
      score: r.lead_data?.score ?? null,
      intent: r.lead_data?.intent ?? null,
      summary: r.summary,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  const store = readFileStore();
  return store.chats
    .filter((c) => c.userKey === userKey)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      title: c.title || 'New chat',
      preview:
        c.history?.find((m) => m.role === 'user')?.content || 'No messages yet',
      score: c.leadData?.score ?? null,
      intent: c.leadData?.intent ?? null,
      summary: c.summary,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
}

export async function getChat(chatId, userKey) {
  if (isDbEnabled()) {
    const { rows: chats } = await query(
      `SELECT id, title, lead_data, summary, created_at, updated_at
       FROM chats WHERE id = $1 AND user_key = $2`,
      [chatId, userKey]
    );
    if (!chats[0]) return null;
    const { rows: messages } = await query(
      `SELECT role, content FROM messages
       WHERE chat_id = $1 ORDER BY created_at ASC, id ASC`,
      [chatId]
    );
    const c = chats[0];
    return {
      id: c.id,
      title: c.title,
      history: messages,
      leadData: c.lead_data,
      summary: c.summary,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  const store = readFileStore();
  const chat = store.chats.find((c) => c.id === chatId && c.userKey === userKey);
  if (!chat) return null;
  return {
    id: chat.id,
    title: chat.title,
    history: chat.history || [],
    leadData: chat.leadData,
    summary: chat.summary,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
  };
}

export async function deleteChat(chatId, userKey) {
  if (isDbEnabled()) {
    const result = await query(
      `DELETE FROM chats WHERE id = $1 AND user_key = $2`,
      [chatId, userKey]
    );
    return result.rowCount > 0;
  }

  const store = readFileStore();
  const before = store.chats.length;
  store.chats = store.chats.filter(
    (c) => !(c.id === chatId && c.userKey === userKey)
  );
  writeFileStore(store);
  return store.chats.length < before;
}

export function warmupFileStore() {
  if (!getPool()) ensureFileStore();
}
