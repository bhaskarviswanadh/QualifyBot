"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  LayoutDashboard,
  LoaderCircle,
  RefreshCw,
  Settings,
  Shield,
  Users,
  Target,
} from "lucide-react";
import {
  getAdminOverview,
  getAdminSettings,
  listAdminLeads,
  listAdminUsers,
  syncAdminLeads,
  type AdminLead,
  type AdminSettings,
  type AdminUser,
} from "@/lib/api";

type Props = {
  adminEmail: string;
  onNotice: (message: string, tone?: "info" | "warn") => void;
  onOpenChat: () => void;
};

type Section = "overview" | "leads" | "users" | "settings";

function SourceBadge({ isGuest }: { isGuest?: boolean }) {
  if (isGuest) {
    return (
      <span className="rounded-full bg-[var(--blue-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--blue-deep)]">
        Guest mode
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--green-deep)]">
      Registered
    </span>
  );
}

export function AdminDashboard({ adminEmail, onNotice, onOpenChat }: Props) {
  const [section, setSection] = useState<Section>("overview");
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [guests, setGuests] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [stats, setStats] = useState({
    totalLeads: 0,
    synced: 0,
    pending: 0,
    highIntent: 0,
    totalUsers: 0,
    guestLeads: 0,
    guestSessions: 0,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [overview, leadList, userList, settingsRes] = await Promise.all([
        getAdminOverview(adminEmail),
        listAdminLeads(adminEmail),
        listAdminUsers(adminEmail),
        getAdminSettings(adminEmail),
      ]);
      setStats({
        totalLeads: overview.stats.totalLeads,
        synced: overview.stats.synced,
        pending: overview.stats.pending,
        highIntent: overview.stats.highIntent,
        totalUsers: overview.stats.totalUsers,
        guestLeads: overview.stats.guestLeads || 0,
        guestSessions: overview.stats.guestSessions || 0,
      });
      setLeads(leadList.items || []);
      setUsers(userList.items || []);
      setGuests(userList.guests || overview.guests || []);
      setSettings(settingsRes.settings);
      setSelected(new Set());
    } catch (err) {
      onNotice(err instanceof Error ? err.message : "Failed to load admin data", "warn");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, [adminEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = useMemo(
    () => leads.length > 0 && selected.size === leads.length,
    [leads, selected]
  );

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSyncSelected() {
    if (!selected.size) {
      onNotice("Select at least one lead first.", "warn");
      return;
    }
    setSyncing(true);
    try {
      const result = await syncAdminLeads(adminEmail, Array.from(selected));
      onNotice(result.message, result.success ? "info" : "warn");
      await loadAll();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : "Sync failed", "warn");
    } finally {
      setSyncing(false);
    }
  }

  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "leads" as const, label: "Leads", icon: Target },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[200px_1fr]">
      <aside className="flex min-h-0 flex-col gap-2 overflow-y-auto rounded-2xl border border-[var(--line)] bg-white/85 p-3">
        <p className="mb-1 inline-flex items-center gap-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          <Shield size={12} className="text-[var(--blue)]" />
          Admin
        </p>
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              section === id
                ? "bg-[var(--blue-soft)] text-[var(--blue-deep)]"
                : "text-[var(--ink)] hover:bg-[var(--grey-soft)]"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenChat}
          className="mt-auto inline-flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm font-medium text-[var(--ink)] hover:border-[var(--green)] hover:text-[var(--green)]"
        >
          Open chat demo
        </button>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white/85 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--ink)]">
              {section === "overview" && "Overview"}
              {section === "leads" && "All leads"}
              {section === "users" && "Users & guests"}
              {section === "settings" && "Settings"}
            </h2>
            <p className="text-xs text-[var(--muted)]">
              {section === "overview" && "Leads, guest activity, and sync status"}
              {section === "leads" && "Guest and registered leads — select & sync to HubSpot"}
              {section === "users" && "Registered accounts and guest-mode browsers"}
              {section === "settings" && "CRM, AI, database, and admin access"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading || syncing}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium hover:border-[var(--blue)] disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {section === "leads" && (
              <button
                type="button"
                onClick={() => void handleSyncSelected()}
                disabled={syncing || selected.size === 0}
                className="btn-primary inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {syncing ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <CloudUpload size={14} />
                )}
                Sync selected ({selected.size})
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-[var(--muted)]">Loading…</p>
          ) : section === "overview" ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Total leads", value: stats.totalLeads },
                  { label: "Guest-mode leads", value: stats.guestLeads },
                  { label: "Pending sync", value: stats.pending },
                  { label: "Synced to HubSpot", value: stats.synced },
                  { label: "Registered users", value: stats.totalUsers },
                  { label: "Guest sessions", value: stats.guestSessions },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--ink)]">
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--line)] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--ink)]">Recent leads</h3>
                  <button
                    type="button"
                    onClick={() => setSection("leads")}
                    className="text-xs font-medium text-[var(--blue)] hover:underline"
                  >
                    View all
                  </button>
                </div>
                {leads.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    No leads yet. Use Open chat demo or have a prospect chat first.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {leads.slice(0, 6).map((lead) => (
                      <li
                        key={lead.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--grey-soft)] px-3 py-2 text-sm"
                      >
                        <span className="inline-flex flex-wrap items-center gap-2 font-medium text-[var(--ink)]">
                          {lead.name || lead.email || "Unnamed lead"}
                          <SourceBadge isGuest={lead.isGuest} />
                        </span>
                        <span className="text-xs text-[var(--muted)]">
                          Score {lead.score} · {lead.intent}
                          {lead.hubspotSynced ? " · Synced" : " · Pending"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : section === "users" ? (
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">
                  Registered users
                </h3>
                <div className="overflow-auto rounded-xl border border-[var(--line)]">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="sticky top-0 bg-[var(--grey-soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2.5">Name</th>
                        <th className="px-3 py-2.5">Email</th>
                        <th className="px-3 py-2.5">Role</th>
                        <th className="px-3 py-2.5">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-[var(--muted)]">
                            No registered users yet.
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="border-t border-[var(--line)]">
                            <td className="px-3 py-2.5 font-medium text-[var(--ink)]">
                              {user.name || "—"}
                            </td>
                            <td className="px-3 py-2.5">{user.email}</td>
                            <td className="px-3 py-2.5">
                              {user.isAdmin ? (
                                <span className="rounded-full bg-[var(--blue-soft)] px-2 py-0.5 text-xs font-medium text-[var(--blue-deep)]">
                                  Admin
                                </span>
                              ) : (
                                <span className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-xs font-medium text-[var(--green-deep)]">
                                  Registered
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">
                  Guest mode sessions
                </h3>
                <p className="mb-2 text-xs text-[var(--muted)]">
                  People who used Continue as guest — each browser gets its own guest session.
                </p>
                <div className="overflow-auto rounded-xl border border-[var(--line)]">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="sticky top-0 bg-[var(--grey-soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
                      <tr>
                        <th className="px-3 py-2.5">Guest</th>
                        <th className="px-3 py-2.5">Mode</th>
                        <th className="px-3 py-2.5">Chats</th>
                        <th className="px-3 py-2.5">Last active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guests.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-6 text-center text-[var(--muted)]">
                            No guest sessions yet.
                          </td>
                        </tr>
                      ) : (
                        guests.map((guest) => (
                          <tr key={guest.id} className="border-t border-[var(--line)]">
                            <td className="px-3 py-2.5 font-medium text-[var(--ink)]">
                              {guest.name || "Guest"}
                            </td>
                            <td className="px-3 py-2.5">
                              <SourceBadge isGuest />
                            </td>
                            <td className="px-3 py-2.5 tabular-nums">
                              {guest.chatCount ?? 0}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                              {guest.lastActive
                                ? new Date(guest.lastActive).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : section === "settings" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">AI</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Gemini model</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.geminiModel || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Embeddings</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.embeddingModel || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Gemini key</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.status?.gemini ? "Connected" : "Missing"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">CRM</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">HubSpot</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.hubspotConfigured ? "Live" : "Not integrated"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Salesforce</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.salesforceConfigured ? "Live" : "Not integrated"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Mock mode</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.crmMockMode ? "On" : "Off"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Database</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">Mode</dt>
                    <dd className="font-medium capitalize text-[var(--ink)]">
                      {settings?.databaseMode || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[var(--muted)]">History</dt>
                    <dd className="font-medium text-[var(--ink)]">
                      {settings?.databaseMode === "neon" ? "Neon Postgres" : "Local fallback"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-[var(--line)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Admin access</h3>
                <p className="mb-2 text-xs text-[var(--muted)]">
                  Accounts that can open this dashboard
                </p>
                <ul className="space-y-1.5">
                  {(settings?.adminEmails || []).map((email) => (
                    <li
                      key={email}
                      className="rounded-lg bg-[var(--blue-soft)] px-3 py-1.5 text-sm font-medium text-[var(--blue-deep)]"
                    >
                      {email}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Default login: <span className="font-medium text-[var(--ink)]">admin</span> /{" "}
                  <span className="font-medium text-[var(--ink)]">admin123</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto rounded-xl border border-[var(--line)]">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead className="sticky top-0 bg-[var(--grey-soft)] text-xs uppercase tracking-wide text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all leads"
                      />
                    </th>
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">Email</th>
                    <th className="px-3 py-2.5">Company</th>
                    <th className="px-3 py-2.5">Source</th>
                    <th className="px-3 py-2.5">Score</th>
                    <th className="px-3 py-2.5">Intent</th>
                    <th className="px-3 py-2.5">HubSpot</th>
                    <th className="px-3 py-2.5">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-8 text-center text-[var(--muted)]">
                        No leads yet. Open chat demo or have a prospect chat first.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="border-t border-[var(--line)] hover:bg-[var(--blue-soft)]/40"
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected.has(lead.id)}
                            onChange={() => toggleOne(lead.id)}
                            aria-label={`Select ${lead.name || lead.email || lead.id}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[var(--ink)]">
                          {lead.name || "—"}
                        </td>
                        <td className="px-3 py-2.5">{lead.email || "—"}</td>
                        <td className="px-3 py-2.5">{lead.company || "—"}</td>
                        <td className="px-3 py-2.5">
                          <SourceBadge isGuest={lead.isGuest} />
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{lead.score}</td>
                        <td className="px-3 py-2.5 text-[var(--muted)]">{lead.intent}</td>
                        <td className="px-3 py-2.5">
                          {lead.hubspotSynced ? (
                            <span className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-xs font-medium text-[var(--green-deep)]">
                              Synced
                            </span>
                          ) : (
                            <span className="rounded-full bg-[var(--grey-soft)] px-2 py-0.5 text-xs text-[var(--muted)]">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[var(--muted)]">
                          {lead.updatedAt
                            ? new Date(lead.updatedAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
