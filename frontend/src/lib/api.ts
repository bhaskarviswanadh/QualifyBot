import type { LeadData, SystemStatus } from "./types";

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

export function startChat() {
  return request<{ sessionId: string; greeting: string }>("/api/chat/start", {
    method: "POST",
  });
}

export function sendMessage(sessionId: string, message: string) {
  return request<{ sessionId: string; reply: string; leadData: LeadData }>(
    "/api/chat/message",
    {
      method: "POST",
      body: JSON.stringify({ sessionId, message }),
    }
  );
}

export function getSummary(sessionId: string) {
  return request<{ summary: string; leadData: LeadData | null }>(
    `/api/chat/${sessionId}/summary`
  );
}

export function syncCrm(sessionId: string) {
  return request<{
    success: boolean;
    message: string;
    results: Record<string, { success: boolean; message?: string }>;
    leadData: LeadData;
  }>("/api/crm/sync", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export function getHealth() {
  return request<{ ok: boolean; status: SystemStatus }>("/api/health");
}
