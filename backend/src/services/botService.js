import { v4 as uuidv4 } from 'uuid';
import { geminiService } from './geminiService.js';
import { ragService } from './ragService.js';
import { emptyLead } from './scoringService.js';
import { getCrmClient } from '../integrations/manager.js';
import * as chatStore from './chatStore.js';

class BotService {
  constructor() {
    this.sessions = new Map();
    this.crm = getCrmClient();
  }

  async initialize() {
    chatStore.warmupFileStore();
    await ragService.initialize();
  }

  async startChat(userKey = 'guest') {
    const sessionId = uuidv4();
    const greeting = geminiService.getGreeting();
    await chatStore.createChat({ id: sessionId, userKey, greeting });
    this.sessions.set(sessionId, {
      userKey,
      history: [{ role: 'assistant', content: greeting }],
      leadData: emptyLead(),
      summary: null,
    });
    return { sessionId, greeting };
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async loadSession(sessionId, userKey) {
    const cached = this.sessions.get(sessionId);
    if (cached && cached.userKey === userKey) return cached;

    const saved = await chatStore.getChat(sessionId, userKey);
    if (!saved) return null;

    const session = {
      userKey,
      history: saved.history || [],
      leadData: saved.leadData || emptyLead(),
      summary: saved.summary || null,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  async chat(sessionId, message, userKey = 'guest') {
    let session = sessionId
      ? await this.loadSession(sessionId, userKey)
      : null;

    if (!session) {
      const started = await this.startChat(userKey);
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

    await chatStore.appendTurn({
      chatId: sessionId,
      userKey,
      userMessage: message,
      assistantReply: reply,
      leadData,
    });

    return { sessionId, reply, leadData };
  }

  async getSummary(sessionId, userKey = 'guest') {
    const session = await this.loadSession(sessionId, userKey);
    if (!session) {
      return { summary: 'Session not found. Start a new chat.', leadData: null };
    }
    const summary = await geminiService.summarize(session.history);
    session.summary = summary;
    this.sessions.set(sessionId, session);
    await chatStore.saveSummary({
      chatId: sessionId,
      userKey,
      summary,
      leadData: session.leadData,
    });
    return { summary, leadData: session.leadData };
  }

  async listHistory(userKey = 'guest') {
    return chatStore.listChats(userKey);
  }

  async getHistoryChat(sessionId, userKey = 'guest') {
    const session = await this.loadSession(sessionId, userKey);
    if (!session) return null;
    const saved = await chatStore.getChat(sessionId, userKey);
    return {
      sessionId,
      messages: session.history,
      leadData: session.leadData,
      summary: session.summary || saved?.summary || null,
      title: saved?.title || 'Chat',
    };
  }

  async deleteHistory(sessionId, userKey = 'guest') {
    this.sessions.delete(sessionId);
    return chatStore.deleteChat(sessionId, userKey);
  }

  async syncCrm(sessionId, userKey = 'guest') {
    const session = await this.loadSession(sessionId, userKey);
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
    const anySuccess = Object.values(results).some((r) => r?.success);
    return {
      success: anySuccess,
      message: anySuccess ? 'CRM sync completed' : 'Not integrated',
      results,
      leadData: session.leadData,
    };
  }
}

export const botService = new BotService();
