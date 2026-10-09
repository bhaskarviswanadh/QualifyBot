"use client";

import { History, LoaderCircle, Trash2 } from "lucide-react";
import type { HistoryItem } from "@/lib/api";

type Props = {
  items: HistoryItem[];
  activeId: string | null;
  loading?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatWhen(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function HistoryPanel({
  items,
  activeId,
  loading,
  onSelect,
  onDelete,
}: Props) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
        <History size={13} className="text-[var(--blue)]" />
        Past chats
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {loading && (
          <div className="flex items-center gap-2 px-1 py-2 text-xs text-[var(--muted)]">
            <LoaderCircle size={13} className="animate-spin" />
            Loading…
          </div>
        )}

        {!loading && items.length === 0 && (
          <p className="rounded-xl bg-[var(--grey-soft)] px-3 py-3 text-xs leading-relaxed text-[var(--muted)]">
            No past chats yet. Send a message and it will show up here with lead
            data.
          </p>
        )}

        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <div
              key={item.id}
              className={`group rounded-xl border px-2.5 py-2 transition ${
                active
                  ? "border-[var(--blue)]/40 bg-[var(--blue-soft)]"
                  : "border-[var(--line)] bg-white hover:border-[var(--blue)]/30"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className="w-full text-left"
                title="Open this chat"
              >
                <p className="line-clamp-1 text-sm font-medium text-[var(--ink)]">
                  {item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-[var(--muted)]">
                  {item.preview}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                  <span>{formatWhen(item.updatedAt)}</span>
                  {item.score != null && (
                    <span className="rounded-full bg-[var(--green-soft)] px-1.5 py-0.5 font-medium text-[var(--green-deep)]">
                      Score {item.score}
                    </span>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="mt-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] text-[var(--muted)] opacity-70 transition hover:bg-[var(--grey-soft)] hover:text-[var(--blue-deep)] group-hover:opacity-100"
                title="Delete chat"
              >
                <Trash2 size={11} />
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
