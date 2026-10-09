"use client";

import type { SystemStatus as Status } from "@/lib/types";

type Props = {
  status: Status | null;
};

export function SystemStatusBar({ status }: Props) {
  const dbLabel =
    status?.database === "neon"
      ? "Neon"
      : status?.database === "configured"
        ? "DB set"
        : "Local";

  const items = [
    {
      label: "API",
      detail: status?.api ? "Online" : "Offline",
      ok: status?.api ?? false,
    },
    {
      label: "Gemini",
      detail: status?.gemini ? "Ready" : "Add API key",
      ok: status?.gemini ?? false,
    },
    {
      label: "History",
      detail: dbLabel,
      ok: status?.database === "neon" || status?.database === "configured",
    },
    {
      label: "CRM",
      detail: "Not integrated",
      ok: false,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)]">
      {items.map(({ label, detail, ok }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/90 px-2.5 py-1"
          title={`${label}: ${detail}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              ok ? "bg-[var(--green)]" : "bg-[var(--grey)]"
            }`}
          />
          <span className="font-medium text-[var(--ink)]">{label}</span>
          <span className="text-[var(--muted)]">{detail}</span>
        </span>
      ))}
    </div>
  );
}
