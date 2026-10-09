import { Router } from 'express';
import { isAdminEmail, settings, getStatus } from '../config/settings.js';
import { getDbMode } from '../db/client.js';
import * as chatStore from '../services/chatStore.js';
import { listUsers } from '../services/authService.js';
import { getCrmClient } from '../integrations/manager.js';

const router = Router();

function requireAdmin(req, res) {
  const email = String(
    req.body?.adminEmail || req.query?.adminEmail || req.headers['x-admin-email'] || ''
  )
    .trim()
    .toLowerCase();
  if (!isAdminEmail(email)) {
    res.status(403).json({
      error: 'Admin access required. Sign in with an admin account.',
    });
    return null;
  }
  return email;
}

router.get('/overview', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const [stats, users, guests, leads] = await Promise.all([
      chatStore.getAdminStats(),
      listUsers(),
      chatStore.listGuestSessions(),
      chatStore.listAllLeads(8),
    ]);
    res.json({
      stats: {
        ...stats,
        totalUsers: users.length,
        guestSessions: guests.length,
      },
      recentLeads: leads,
      users,
      guests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const [registered, guests] = await Promise.all([
      listUsers(),
      chatStore.listGuestSessions(),
    ]);
    res.json({
      items: registered,
      guests,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leads', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const items = await chatStore.listAllLeads();
    res.json({ items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const status = { ...getStatus(), database: getDbMode() };
    res.json({
      settings: {
        geminiModel: settings.geminiModel,
        embeddingModel: settings.embeddingModel,
        adminEmails: settings.adminEmails,
        hubspotConfigured: Boolean(settings.crm.hubspotApiKey) && !settings.crm.mockMode,
        salesforceConfigured:
          Boolean(settings.crm.salesforceApiKey) && !settings.crm.mockMode,
        crmMockMode: settings.crm.mockMode,
        databaseMode: getDbMode(),
        status,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sync', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (!ids.length) {
      return res.status(400).json({ error: 'Select at least one lead' });
    }

    const crm = getCrmClient();
    const results = [];

    for (const id of ids) {
      const chat = await chatStore.getChatById(id);
      if (!chat) {
        results.push({ id, success: false, message: 'Lead not found' });
        continue;
      }

      const lead = chat.leadData?.lead || {};
      const payload = {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        role: lead.role,
        industry: lead.industry,
        intent: chat.leadData?.intent,
        score: chat.leadData?.score,
      };

      if (!payload.email && !payload.name) {
        results.push({
          id,
          success: false,
          message: 'Lead needs a name or email before sync',
        });
        continue;
      }

      const hubspot = await crm.hubspot.createLead(payload);
      if (hubspot.success) {
        await chatStore.markHubspotSynced(id, hubspot.hubspot_id);
      }
      results.push({
        id,
        success: Boolean(hubspot.success),
        message: hubspot.message,
        hubspotId: hubspot.hubspot_id || null,
      });
    }

    const synced = results.filter((r) => r.success).length;
    res.json({
      success: synced > 0,
      message: `Synced ${synced} of ${results.length} lead(s) to HubSpot`,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
