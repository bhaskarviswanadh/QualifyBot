import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(BACKEND_ROOT, 'data');

export const settings = {
  port: Number(process.env.PORT || 4000),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  databaseUrl: process.env.DATABASE_URL || '',
  adminEmails: String(process.env.ADMIN_EMAILS || 'admin@qualifybot.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  topK: Number(process.env.RAG_TOP_K || 4),
  chunkSize: 800,
  chunkOverlap: 120,
  crm: {
    mockMode: String(process.env.CRM_MOCK_MODE ?? 'true').toLowerCase() !== 'false',
    hubspotApiKey: process.env.HUBSPOT_API_KEY || '',
    hubspotBaseUrl: process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com',
    salesforceApiKey: process.env.SALESFORCE_API_KEY || '',
    salesforceBaseUrl:
      process.env.SALESFORCE_BASE_URL || 'https://your-instance.salesforce.com',
  },
  dataDir: DATA_DIR,
};

export function isAdminEmail(email) {
  if (!email) return false;
  const normalized = String(email).trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'admin@qualifybot.com') return true;
  return settings.adminEmails.includes(normalized);
}

export function getStatus() {
  const hubspot =
    !settings.crm.mockMode && Boolean(settings.crm.hubspotApiKey);
  const salesforce =
    !settings.crm.mockMode && Boolean(settings.crm.salesforceApiKey);

  return {
    api: true,
    gemini: Boolean(settings.geminiApiKey),
    huggingFace: false,
    crm: hubspot || salesforce ? 'live' : 'not_integrated',
    hubspot: hubspot ? 'live' : 'not_integrated',
    salesforce: salesforce ? 'live' : 'not_integrated',
    database: settings.databaseUrl ? 'configured' : 'local',
  };
}
