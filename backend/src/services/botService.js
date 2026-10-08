import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './geminiService.js';
import { ragService } from './ragService.js';
import { emptyLead } from './scoringService.js';
import { getCrmClient } from '../integrations/manager.js';

class BotService {
  constructor() {
    this.sessions = new Map();
    this.crm = getCrmClient();
  }

  async initialize() {
    await ragService.initialize();
  }

  startChat() {
    const sessionId = uuidv4();
    const greeting = geminiService.getGreeting();
    this.sessions.set(sessionId, {
      history: [{ role: 'assistant', content: greeting }],
      leadData: emptyLead(),
    });
    return { sessionId, greeting };
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async chat(sessionId, message) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      const started = this.startChat();
      sessionId = started.sessionId;
      session = this.sessions.get(sessionId);
    }

    const knowledge = await ragService.getContext(message);
    const { reply, leadData } = await geminiService.generateReply({
      history: session.history,
      userMessage: message,
      knowledge,
    });

    session.history.push({ role: 'user', content: message });
    session.history.push({ role: 'assistant', content: reply });
    session.leadData = leadData;
    this.sessions.set(sessionId, session);

    return { sessionId, reply, leadData };
  }

  async getSummary(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { summary: 'Session not found. Start a new chat.', leadData: null };
    }
    const summary = await geminiService.summarize(session.history);
    return { summary, leadData: session.leadData };
  }

  async syncCrm(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, message: 'Session not found', results: {} };
    }

    const lead = session.leadData?.lead || {};
    const payload = {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      role: lead.role,
      industry: lead.industry,
      intent: session.leadData?.intent,
      score: session.leadData?.score,
      crm_tags: session.leadData?.crm_tags,
    };

    const results = await this.crm.syncLeads(payload);
    return {
      success: Object.values(results).some((r) => r?.success),
      message: 'CRM sync completed',
      results,
      leadData: session.leadData,
    };
  }
}

export const botService = new BotService();
