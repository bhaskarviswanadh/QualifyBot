import type { ChatMessage, LeadData, SystemStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export type HistoryItem = {
  id: string;
  title: string;
  preview: string;
  score: number | null;
  intent: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  userKey: string;
  isAdmin?: boolean;
};

export type AdminLead = {
  id: string;
  userKey: string;
  isGuest?: boolean;
  source?: string;
  title: string;
  name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  industry: string | null;
  score: number;
  intent: string;
  summary: string | null;
  hubspotSynced: boolean;
  hubspotId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  userKey: string;
  isAdmin: boolean;
  isGuest?: boolean;
  chatCount?: number;
  firstSeen?: string;
  lastActive?: string;
  createdAt: string;
};

export type AdminStats = {
  totalLeads: number;
  synced: number;
  pending: number;
  highIntent: number;
  totalUsers: number;
  guestLeads?: number;
  registeredLeads?: number;
  guestSessions?: number;
};

export type AdminSettings = {
  geminiModel: string;
  embeddingModel: string;
  adminEmails: string[];
  hubspotConfigured: boolean;
  salesforceConfigured: boolean;
  crmMockMode: boolean;
  databaseMode: string;
  status: SystemStatus;
};

export function getAdminOverview(adminEmail: string) {
  const q = encodeURIComponent(adminEmail);
  return request<{
    stats: AdminStats;
    recentLeads: AdminLead[];
    users: AdminUser[];
    guests: AdminUser[];
  }>(`/api/admin/overview?adminEmail=${q}`);
}

export function listAdminUsers(adminEmail: string) {
  const q = encodeURIComponent(adminEmail);
  return request<{ items: AdminUser[]; guests: AdminUser[] }>(
    `/api/admin/users?adminEmail=${q}`
  );
}

export function getAdminSettings(adminEmail: string) {
  const q = encodeURIComponent(adminEmail);
  return request<{ settings: AdminSettings }>(
    `/api/admin/settings?adminEmail=${q}`
  );
}

export function listAdminLeads(adminEmail: string) {
  const q = encodeURIComponent(adminEmail);
  return request<{ items: AdminLead[] }>(`/api/admin/leads?adminEmail=${q}`);
}

export function syncAdminLeads(adminEmail: string, ids: string[]) {
  return request<{
    success: boolean;
    message: string;
    results: Array<{ id: string; success: boolean; message: string }>;
  }>("/api/admin/sync", {
    method: "POST",
    body: JSON.stringify({ adminEmail, ids }),
  });
}

export function registerAccount(input: {
  email: string;
  password: string;
  name?: string;
}) {
  return request<{ user: AuthUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginAccount(input: { email: string; password: string }) {
  return request<{ user: AuthUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function startChat(userKey: string) {
  return request<{ sessionId: string; greeting: string }>("/api/chat/start", {
    method: "POST",
    body: JSON.stringify({ userKey }),
  });
}

export function sendMessage(sessionId: string, message: string, userKey: string) {
  return request<{ sessionId: string; reply: string; leadData: LeadData }>(
    "/api/chat/message",
    {
      method: "POST",
      body: JSON.stringify({ sessionId, message, userKey }),
    }
  );
}

export function getSummary(sessionId: string, userKey: string) {
  const q = encodeURIComponent(userKey);
  return request<{ summary: string; leadData: LeadData | null }>(
    `/api/chat/${sessionId}/summary?userKey=${q}`
  );
}

export function syncCrm(sessionId: string, userKey: string) {
  return request<{
    success: boolean;
    message: string;
    results: Record<string, { success: boolean; message?: string }>;
    leadData: LeadData;
  }>("/api/crm/sync", {
    method: "POST",
    body: JSON.stringify({ sessionId, userKey }),
  });
}

export function listHistory(userKey: string) {
  const q = encodeURIComponent(userKey);
  return request<{ items: HistoryItem[] }>(`/api/chat/history?userKey=${q}`);
}

export function getHistoryChat(sessionId: string, userKey: string) {
  const q = encodeURIComponent(userKey);
  return request<{
    sessionId: string;
    messages: ChatMessage[];
    leadData: LeadData | null;
    summary: string | null;
    title: string;
  }>(`/api/chat/history/${sessionId}?userKey=${q}`);
}

export function deleteHistoryChat(sessionId: string, userKey: string) {
  const q = encodeURIComponent(userKey);
  return request<{ ok: boolean }>(`/api/chat/history/${sessionId}?userKey=${q}`, {
    method: "DELETE",
  });
}

export function getHealth() {
  return request<{ ok: boolean; status: SystemStatus }>("/api/health");
}
