"use client";

import { Activity, Cloud, Sparkles } from "lucide-react";
import { SiHubspot } from "react-icons/si";
import type { SystemStatus as Status } from "@/lib/types";

type Props = {
  status: Status | null;
};

export function SystemStatusBar({ status }: Props) {
  const items = [
    {
      label: "API",
      ok: status?.api ?? false,
      icon: Activity,
    },
    {
      label: "Gemini",
      ok: status?.gemini ?? false,
      icon: Sparkles,
    },
    {
      label: status?.crm === "live" ? "CRM Live" : "CRM Mock",
      ok: Boolean(status),
      icon: Cloud,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
      {items.map(({ label, ok, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/50 px-3 py-1 backdrop-blur"
        >
          <span
            className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"}`}
          />
          <Icon size={14} />
          {label}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
        <SiHubspot className="text-[#ff7a59]" size={14} />
        HubSpot + Salesforce
      </span>
    </div>
  );
}
