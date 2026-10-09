"use client";

import type { ComponentType } from "react";
import {
  BadgeCheck,
  Building2,
  Mail,
  Target,
  Tags,
  UserRound,
  Zap,
} from "lucide-react";
import type { LeadData } from "@/lib/types";

type Props = {
  leadData: LeadData | null;
  summary: string | null;
  sessionId: string | null;
};

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="shrink-0 text-[var(--blue)]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-[var(--ink)]">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

export function LeadSidebar({ leadData, summary }: Props) {
  const lead = leadData?.lead;
  const score = leadData?.score ?? 0;

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div className="shrink-0 rounded-2xl bg-brand-gradient p-4 text-white shadow-md shadow-[var(--blue)]/15">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white/80">Lead score</span>
          <span className="text-2xl font-semibold tabular-nums">{score}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/85">
          Intent:{" "}
          <span className="font-semibold text-white">
            {leadData?.intent || "researching"}
          </span>
        </p>
      </div>

      <div className="shrink-0 space-y-2.5 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
          <BadgeCheck size={15} className="text-[var(--green)]" />
          Lead profile
        </h3>
        <Field icon={UserRound} label="Name" value={lead?.name} />
        <Field icon={Mail} label="Email" value={lead?.email} />
        <Field icon={Building2} label="Company" value={lead?.company} />
        <Field icon={Target} label="Role" value={lead?.role} />
        <Field icon={Zap} label="Industry" value={lead?.industry} />
      </div>

      <div className="shrink-0 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]">
        <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">Signals</h3>
        <ul className="space-y-1.5">
          {(leadData?.top_signals?.length
            ? leadData.top_signals
            : ["Chat to collect signals"]
          ).map((signal) => (
            <li
              key={signal}
              className="rounded-lg bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--ink)]"
            >
              {signal}
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]">
        <h3 className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)]">
          <Tags size={15} className="text-[var(--green)]" />
          Next step
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(leadData?.crm_tags?.length ? leadData.crm_tags : ["pending"]).map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--green)]"
              >
                {tag}
              </span>
            )
          )}
        </div>
        {leadData?.recommended_action && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            <span className="font-medium text-[var(--ink)]">
              {leadData.recommended_action.replaceAll("_", " ")}
            </span>
            {leadData.explain ? ` — ${leadData.explain}` : ""}
          </p>
        )}
      </div>

      <div
        id="lead-summary"
        className="rounded-2xl bg-white p-3.5 ring-1 ring-[var(--line)]"
      >
        <h3 className="mb-1.5 text-sm font-semibold text-[var(--ink)]">
          Summary
        </h3>
        {summary ? (
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--ink)]">
            {summary}
          </p>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Click <span className="font-medium text-[var(--green)]">Summary</span>{" "}
            above to generate a conversation recap here.
          </p>
        )}
      </div>
    </aside>
  );
}
