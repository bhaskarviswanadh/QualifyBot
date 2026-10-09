"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CloudUpload,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  X,
} from "lucide-react";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  setGuestSession,
  type AuthSession,
} from "@/lib/auth";
import {
  deleteHistoryChat,
  getHealth,
  getHistoryChat,
  getSummary,
  listHistory,
  sendMessage,
  startChat,
  syncCrm,
  type HistoryItem,
} from "@/lib/api";
import type { ChatMessage, LeadData, SystemStatus } from "@/lib/types";
import { AdminDashboard } from "./AdminDashboard";
import { BrandLogo } from "./BrandLogo";
import { ChatPanel } from "./ChatPanel";
import { HistoryPanel } from "./HistoryPanel";
import { LeadSidebar } from "./LeadSidebar";
import { LoginPage } from "./LoginPage";
import { SystemStatusBar } from "./SystemStatus";

export function QualifyBotApp() {
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<LeadData | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"info" | "warn">("info");
  const [view, setView] = useState<"chat" | "admin">("chat");

  const userKey = auth?.userKey || "";
  const isAdmin = Boolean(auth?.isAdmin && auth?.email);

  useEffect(() => {
    const session = getAuthSession();
    setAuth(session);
    if (session?.isAdmin) setView("admin");
    setAuthChecked(true);
  }, []);

  const refreshHistory = useCallback(async (key: string) => {
    if (!key) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    try {
      const result = await listHistory(key);
      setHistory(result.items || []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const boot = useCallback(async () => {
    if (!userKey) return;
    setLoading(true);
    setNotice(null);
    setSummary(null);
    setHistory([]);
    try {
      const [chat, health] = await Promise.all([
        startChat(userKey),
        getHealth().catch(() => null),
      ]);
      setSessionId(chat.sessionId);
      setMessages([{ role: "assistant", content: chat.greeting }]);
      setLeadData(null);
      if (health?.status) setStatus(health.status);
      setNoticeTone("info");
      setNotice("New chat started. Ask about role, company, or needs.");
      await refreshHistory(userKey);
    } catch (err) {
      setNoticeTone("warn");
      setNotice(
        err instanceof Error
          ? err.message
          : "Could not reach the API. Start the backend on port 4000."
      );
    } finally {
      setLoading(false);
    }
  }, [userKey, refreshHistory]);

  useEffect(() => {
    if (!auth?.userKey) return;
    // Admins land on dashboard — don't auto-open chat
    if (auth.isAdmin && view === "admin") {
      void getHealth()
        .then((health) => {
          if (health?.status) setStatus(health.status);
        })
        .catch(() => null);
      return;
    }
    setHistory([]);
    setMessages([]);
    setLeadData(null);
    setSummary(null);
    setSessionId(null);
    void boot();
  }, [auth?.userKey, view]); // eslint-disable-line react-hooks/exhaustive-deps -- reset when identity/view changes

  function handleLogin(user: {
    userKey: string;
    email: string;
    name?: string | null;
    isAdmin?: boolean;
  }) {
    const admin = Boolean(user.isAdmin);
    setView(admin ? "admin" : "chat");
    setAuth(
      setAuthSession({
        userKey: user.userKey,
        email: user.email,
        name: user.name,
        isGuest: false,
        isAdmin: admin,
      })
    );
  }

  function handleGuest() {
    setView("chat");
    setAuth(setGuestSession());
  }

  function handleLogout() {
    clearAuthSession();
    setAuth(null);
    setView("chat");
    setSessionId(null);
    setMessages([]);
    setLeadData(null);
    setSummary(null);
    setHistory([]);
    setNotice(null);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setNotice(null);
    try {
      const result = await sendMessage(sessionId || "", text, userKey);
      setSessionId(result.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.reply },
      ]);
      setLeadData(result.leadData);
      await refreshHistory(userKey);
    } catch (err) {
      setNoticeTone("warn");
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

  async function handleOpenHistory(id: string) {
    setBusyAction("history");
    setNotice(null);
    try {
      const chat = await getHistoryChat(id, userKey);
      setSessionId(chat.sessionId);
      setMessages(chat.messages || []);
      setLeadData(chat.leadData);
      setSummary(chat.summary);
      setNoticeTone("info");
      setNotice(`Opened past chat: ${chat.title}`);
    } catch (err) {
      setNoticeTone("warn");
      setNotice(err instanceof Error ? err.message : "Could not open chat");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteHistory(id: string) {
    try {
      await deleteHistoryChat(id, userKey);
      if (sessionId === id) {
        await boot();
      } else {
        await refreshHistory(userKey);
      }
      setNoticeTone("info");
      setNotice("Chat deleted.");
    } catch (err) {
      setNoticeTone("warn");
      setNotice(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleSummary() {
    if (!sessionId) {
      setNoticeTone("warn");
      setNotice("Start a chat first, then generate a summary.");
      return;
    }
    setBusyAction("summary");
    setNotice(null);
    try {
      const result = await getSummary(sessionId, userKey);
      setSummary(result.summary);
      if (result.leadData) setLeadData(result.leadData);
      setNoticeTone("info");
      setNotice("Summary ready — see the Summary panel on the right.");
      await refreshHistory(userKey);
      requestAnimationFrame(() => {
        document.getElementById("lead-summary")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    } catch (err) {
      setNoticeTone("warn");
      setNotice(err instanceof Error ? err.message : "Summary failed");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSync() {
    if (!sessionId) {
      setNoticeTone("warn");
      setNotice("Start a chat first before syncing.");
      return;
    }
    setBusyAction("sync");
    try {
      const result = await syncCrm(sessionId, userKey);
      if (result.leadData) setLeadData(result.leadData);
      const hs = result.results?.hubspot?.message || "Not integrated";
      const sf = result.results?.salesforce?.message || "Not integrated";
      const hsOk = Boolean(result.results?.hubspot?.success);
      setNoticeTone(hsOk ? "info" : "warn");
      setNotice(
        hsOk
          ? `Synced to HubSpot. ${hs}`
          : `CRM sync: HubSpot — ${hs}. Salesforce — ${sf}.`
      );
    } catch (err) {
      setNoticeTone("warn");
      setNotice(err instanceof Error ? err.message : "CRM sync failed");
    } finally {
      setBusyAction(null);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex h-dvh items-center justify-center bg-atmosphere">
        <p className="text-sm text-[var(--muted)]">Loading…</p>
      </div>
    );
  }

  if (!auth) {
    return <LoginPage onSuccess={handleLogin} onGuest={handleGuest} />;
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-atmosphere" />
      <div className="pointer-events-none absolute -left-24 top-6 h-56 w-56 rounded-full bg-[var(--blue)]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-6 h-64 w-64 rounded-full bg-[var(--green)]/12 blur-3xl" />

      <main className="relative mx-auto flex h-dvh max-w-7xl flex-col gap-3 overflow-hidden px-4 py-3 md:px-6 md:py-4">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BrandLogo
              size={36}
              className="shrink-0 rounded-lg shadow-md shadow-[var(--blue)]/20"
            />
            <div className="min-w-0">
              <p className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] md:text-2xl">
                Qualify<span className="text-[var(--blue)]">Bot</span>
              </p>
              <p className="truncate text-xs text-[var(--muted)]">
                {auth.isGuest
                  ? "Guest mode · only your chats on this browser"
                  : isAdmin
                    ? `${auth.email} · admin (all leads)`
                    : `${auth.email} · only your chats & lead data`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:block">
              <SystemStatusBar status={status} />
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setView(view === "admin" ? "chat" : "admin")}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  view === "admin"
                    ? "border-[var(--blue)] bg-[var(--blue-soft)] text-[var(--blue-deep)]"
                    : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--blue)]"
                }`}
              >
                {view === "admin" ? (
                  <>
                    <MessageSquare size={13} />
                    Chat
                  </>
                ) : (
                  <>
                    <LayoutDashboard size={13} />
                    Admin leads
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--blue)] hover:text-[var(--blue)]"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </header>

        {view === "admin" && isAdmin && auth.email ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            {notice && (
              <div
                className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-xs ${
                  noticeTone === "warn"
                    ? "border border-[var(--blue)]/20 bg-[var(--blue-soft)] text-[var(--blue-deep)]"
                    : "border border-[var(--green)]/25 bg-[var(--green-soft)] text-[var(--green-deep)]"
                }`}
              >
                <span className="min-w-0 flex-1">{notice}</span>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="shrink-0 opacity-70 hover:opacity-100"
                  aria-label="Dismiss"
                >
                  <X size={12} />
                </button>
              </div>
            )}
            <AdminDashboard
              adminEmail={auth.email}
              onOpenChat={() => setView("chat")}
              onNotice={(message, tone = "info") => {
                setNoticeTone(tone);
                setNotice(message);
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void boot()}
                disabled={loading || busyAction !== null}
                title="Start a fresh conversation"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-50"
              >
                <MessageSquarePlus size={15} />
                New chat
              </button>
              <button
                type="button"
                onClick={() => void handleSummary()}
                disabled={!sessionId || busyAction !== null}
                title="Generate a short summary of this chat"
                className="btn-secondary inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {busyAction === "summary" ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <FileText size={15} />
                )}
                Summary
              </button>
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={!sessionId || busyAction !== null}
                title="Push this chat lead to HubSpot"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3.5 py-1.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--green)] hover:text-[var(--green)] disabled:opacity-50"
              >
                {busyAction === "sync" ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <CloudUpload size={15} />
                )}
                Sync CRM
              </button>
              {notice && (
                <div
                  className={`ml-auto flex max-w-md items-start gap-2 rounded-xl px-3 py-1.5 text-xs ${
                    noticeTone === "warn"
                      ? "border border-[var(--blue)]/20 bg-[var(--blue-soft)] text-[var(--blue-deep)]"
                      : "border border-[var(--green)]/25 bg-[var(--green-soft)] text-[var(--green-deep)]"
                  }`}
                >
                  <span className="min-w-0 flex-1">{notice}</span>
                  <button
                    type="button"
                    onClick={() => setNotice(null)}
                    className="shrink-0 opacity-70 hover:opacity-100"
                    aria-label="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>

            <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[220px_1.45fr_1fr]">
              <div className="hidden min-h-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 p-3 lg:block">
                <HistoryPanel
                  items={history}
                  activeId={sessionId}
                  loading={historyLoading || busyAction === "history"}
                  onSelect={(id) => void handleOpenHistory(id)}
                  onDelete={(id) => void handleDeleteHistory(id)}
                />
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white/80 p-3 shadow-[0_12px_40px_rgba(31,41,55,0.06)] md:p-4">
                <div className="mb-2 shrink-0 text-xs font-medium text-[var(--muted)]">
                  Chat · prospect talks here
                </div>
                <ChatPanel
                  messages={messages}
                  input={input}
                  loading={loading}
                  onInputChange={setInput}
                  onSend={() => void handleSend()}
                />
              </div>

              <div className="min-h-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white/70 p-3 md:p-4">
                <div className="mb-2 shrink-0 text-xs font-medium text-[var(--muted)]">
                  Lead details · updates as they chat
                </div>
                <LeadSidebar
                  leadData={leadData}
                  summary={summary}
                  sessionId={sessionId}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
