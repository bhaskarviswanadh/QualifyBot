import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { settings } from '../config/settings.js';

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function chunkText(text, size = settings.chunkSize, overlap = settings.chunkOverlap) {
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  const chunks = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + size, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

class RagService {
  constructor() {
    this.chunks = [];
    this.ready = false;
    this.genAI = settings.geminiApiKey
      ? new GoogleGenerativeAI(settings.geminiApiKey)
      : null;
  }

  async loadDocuments() {
    const dirs = [
      ['product_docs', path.join(settings.dataDir, 'product_docs')],
      ['case_studies', path.join(settings.dataDir, 'case_studies')],
      ['competitor_battlecards', path.join(settings.dataDir, 'competitor_battlecards')],
    ];

    const loaded = [];
    for (const [docType, dirPath] of dirs) {
      let entries = [];
      try {
        entries = await fs.readdir(dirPath);
      } catch {
        continue;
      }
      for (const file of entries) {
        if (!file.endsWith('.txt')) continue;
        const full = path.join(dirPath, file);
        const content = await fs.readFile(full, 'utf8');
        for (const chunk of chunkText(content)) {
          loaded.push({ docType, source: file, text: chunk, embedding: null });
        }
      }
    }
    this.chunks = loaded;
  }

  async embed(text) {
    if (!this.genAI) return null;
    const model = this.genAI.getGenerativeModel({ model: settings.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding?.values || null;
  }

  async initialize() {
    await this.loadDocuments();
    if (!this.genAI) {
      console.warn('[rag] GEMINI_API_KEY missing — keyword fallback only');
      this.ready = true;
      return;
    }

    console.log(`[rag] Embedding ${this.chunks.length} chunks...`);
    for (const chunk of this.chunks) {
      try {
        chunk.embedding = await this.embed(chunk.text);
      } catch (err) {
        console.warn('[rag] embed failed:', err.message);
      }
    }
    this.ready = true;
    console.log('[rag] Knowledge base ready');
  }

  keywordSearch(query, k = settings.topK) {
    const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
    const scored = this.chunks.map((chunk) => {
      const hay = chunk.text.toLowerCase();
      const score = terms.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
      return { chunk, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s) => s.chunk);
  }

  async retrieve(query, k = settings.topK) {
    if (!this.chunks.length) return [];

    if (!this.genAI) {
      return this.keywordSearch(query, k);
    }

    let queryEmbedding = null;
    try {
      queryEmbedding = await this.embed(query);
    } catch (err) {
      console.warn('[rag] query embed failed, using keywords:', err.message);
      return this.keywordSearch(query, k);
    }

    if (!queryEmbedding) return this.keywordSearch(query, k);

    const ranked = this.chunks
      .filter((c) => Array.isArray(c.embedding))
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((s) => s.chunk);

    return ranked.length ? ranked : this.keywordSearch(query, k);
  }

  async getContext(query) {
    const hits = await this.retrieve(query);
    if (!hits.length) return '';
    return hits
      .map((h) => `[${h.docType}/${h.source}]\n${h.text}`)
      .join('\n\n---\n\n');
  }
}

export const ragService = new RagService();
