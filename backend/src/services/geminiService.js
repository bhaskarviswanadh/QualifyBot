import { GoogleGenerativeAI } from '@google/generative-ai';
import { settings } from '../config/settings.js';
import {
  GREETING,
  ERROR_REPLY,
  buildChatPrompt,
  buildLeadJsonPrompt,
  buildSummaryPrompt,
} from '../config/prompts.js';
import { normalizeLeadData, emptyLead } from './scoringService.js';

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

class GeminiService {
  constructor() {
    this.client = settings.geminiApiKey
      ? new GoogleGenerativeAI(settings.geminiApiKey)
      : null;
  }

  get model() {
    if (!this.client) return null;
    return this.client.getGenerativeModel({ model: settings.geminiModel });
  }

  isConfigured() {
    return Boolean(this.client);
  }

  getGreeting() {
    return GREETING;
  }

  async generateReply({ history, userMessage, knowledge }) {
    const historyText = (history || [])
      .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
      .join('\n');

    if (!this.model) {
      return {
        reply: `Thanks for sharing that. ${ERROR_REPLY} (Gemini API key not configured — set GEMINI_API_KEY.)`,
        leadData: normalizeLeadData(emptyLead(), `${historyText}\n${userMessage}`),
      };
    }

    const chatPrompt = buildChatPrompt({ historyText, userMessage, knowledge });
    const jsonPrompt = buildLeadJsonPrompt({ historyText, userMessage, knowledge });

    try {
      const [chatResult, jsonResult] = await Promise.all([
        this.model.generateContent(chatPrompt),
        this.model.generateContent(jsonPrompt),
      ]);

      const reply =
        chatResult.response?.text()?.trim() || ERROR_REPLY;
      const parsed = extractJson(jsonResult.response?.text() || '');
      const leadData = normalizeLeadData(
        parsed,
        `${historyText}\nUser: ${userMessage}`
      );

      return { reply, leadData };
    } catch (err) {
      console.error('[gemini] generate failed:', err.message);
      return {
        reply: ERROR_REPLY,
        leadData: normalizeLeadData(emptyLead(), `${historyText}\n${userMessage}`),
      };
    }
  }

  async summarize(history) {
    const historyText = (history || [])
      .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
      .join('\n');

    if (!historyText) return 'No conversation yet.';
    if (!this.model) {
      return `Conversation so far (${history.length} messages). Configure GEMINI_API_KEY for AI summaries.`;
    }

    try {
      const result = await this.model.generateContent(buildSummaryPrompt(historyText));
      return result.response?.text()?.trim() || 'Unable to summarize.';
    } catch (err) {
      console.error('[gemini] summary failed:', err.message);
      return 'Summary unavailable right now.';
    }
  }
}

export const geminiService = new GeminiService();
