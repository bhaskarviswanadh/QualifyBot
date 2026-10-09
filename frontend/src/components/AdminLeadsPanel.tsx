"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  LoaderCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  listAdminLeads,
  syncAdminLeads,
  type AdminLead,
} from "@/lib/api";

type Props = {
  adminEmail: string;
  onNotice: (message: string, tone?: "info" | "warn") => void;
};

export function AdminLeadsPanel({ adminEmail, onNotice }: Props) {
  const [items, setItems] = useState<AdminLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await listAdminLeads(adminEmail);
      setItems(result.items || []);
      setSelected(new Set());
    } catch (err) {
      onNotice(err instanceof Error ? err.message : "Failed to load leads", "warn");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [adminEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const allSelected = useMemo(
    () => items.length > 0 && selected.size === items.length,
    [items, selected]
  );

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((i) => i.id)));
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
      await load();
    } catch (err) {
      onNotice(err instanceof Error ? err.message : "Sync failed", "warn");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white/85 p-4 shadow-[0_12px_40px_rgba(31,41,55,0.06)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="inline-flex items-center gap-2 font-display text-xl font-semibold text-[var(--ink)]">
            <Shield size={18} className="text-[var(--blue)]" />
            Admin · All leads
          </h2>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Leads from every chat. Select and sync to HubSpot here — no need to
            open HubSpot first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || syncing}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:border-[var(--blue)] disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
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
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--line)]">
        <table className="w-full min-w-[720px] text-left text-sm">
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
              <th className="px-3 py-2.5">Score</th>
              <th className="px-3 py-2.5">Intent</th>
              <th className="px-3 py-2.5">HubSpot</th>
              <th className="px-3 py-2.5">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[var(--muted)]">
                  Loading leads…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[var(--muted)]">
                  No leads yet. Have a prospect chat first, then refresh here.
                </td>
              </tr>
            )}
            {!loading &&
              items.map((lead) => (
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
                  <td className="px-3 py-2.5 text-[var(--ink)]">
                    {lead.email || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--ink)]">
                    {lead.company || "—"}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-[var(--ink)]">
                    {lead.score}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--muted)]">{lead.intent}</td>
                  <td className="px-3 py-2.5">
                    {lead.hubspotSynced ? (
                      <span className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-xs font-medium text-[var(--green-deep)]">
                        Synced
                      </span>
                    ) : (
                      <span className="rounded-full bg-[var(--grey-soft)] px-2 py-0.5 text-xs font-medium text-[var(--muted)]">
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
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
