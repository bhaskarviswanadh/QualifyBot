"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CloudUpload,
  FileText,
  LoaderCircle,
  MessageSquarePlus,
} from "lucide-react";
import { FaSalesforce } from "react-icons/fa";
import { getHealth, getSummary, sendMessage, startChat, syncCrm } from "@/lib/api";
import type { ChatMessage, LeadData, SystemStatus } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";
import { LeadSidebar } from "./LeadSidebar";
import { SystemStatusBar } from "./SystemStatus";

export function QualifyBotApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const boot = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    setSummary(null);
    try {
      const [chat, health] = await Promise.all([
        startChat(),
        getHealth().catch(() => null),
      ]);
      setSessionId(chat.sessionId);
      setMessages([{ role: "assistant", content: chat.greeting }]);
      setLeadData(null);
      if (health?.status) setStatus(health.status);
    } catch (err) {
      setNotice(
        err instanceof Error
          ? err.message
          : "Could not reach the API. Is the backend running on :4000?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setNotice(null);
    try {
      const result = await sendMessage(sessionId || "", text);
      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
      setLeadData(result.leadData);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Chat failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry — I hit a snag. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSummary() {
    if (!sessionId) return;
    setBusyAction("summary");
    try {
      const result = await getSummary(sessionId);
      setSummary(result.summary);
      if (result.leadData) setLeadData(result.leadData);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSync() {
    if (!sessionId) return;
    setBusyAction("sync");
    try {
      const result = await syncCrm(sessionId);
      if (result.leadData) setLeadData(result.leadData);
      const hs = result.results?.hubspot?.message || "HubSpot done";
      const sf = result.results?.salesforce?.message || "Salesforce done";
      setNotice(`${result.message}: ${hs}; ${sf}`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "CRM sync failed");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-atmosphere" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[var(--accent)]/20 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl animate-drift-slow" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-4xl tracking-tight text-[var(--ink)] md:text-5xl">
              QualifyBot
            </p>
            <p className="mt-2 max-w-xl text-[var(--muted)]">
              Chat with prospects, score intent in real time, and sync qualified
              leads to CRM.
            </p>
          </div>
          <SystemStatusBar status={status} />
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void boot()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink)] backdrop-blur transition hover:border-[var(--accent)]"
          >
            <MessageSquarePlus size={16} />
            New Chat
          </button>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={!sessionId || busyAction === "sync"}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink)] backdrop-blur transition hover:border-[var(--accent)] disabled:opacity-50"
          >
            {busyAction === "sync" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <CloudUpload size={16} />
            )}
            Sync to CRM
            <FaSalesforce className="text-sky-600" />
          </button>
          <button
            type="button"
            onClick={() => void handleSummary()}
            disabled={!sessionId || busyAction === "summary"}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--ink)] backdrop-blur transition hover:border-[var(--accent)] disabled:opacity-50"
          >
            {busyAction === "summary" ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Show Summary
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {notice}
          </div>
        )}

        <div className="grid min-h-[70vh] flex-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex min-h-[420px] flex-col rounded-[28px] border border-[var(--line)] bg-white/55 p-4 shadow-[0_20px_60px_rgba(15,40,50,0.08)] backdrop-blur-md md:p-6">
            <ChatPanel
              messages={messages}
              input={input}
              loading={loading}
              onInputChange={setInput}
              onSend={() => void handleSend()}
            />
          </div>
          <div className="min-h-[420px] rounded-[28px] border border-[var(--line)] bg-white/40 p-4 backdrop-blur-md md:p-5">
            <LeadSidebar
              leadData={leadData}
              summary={summary}
              sessionId={sessionId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
