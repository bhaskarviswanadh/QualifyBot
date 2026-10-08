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
import { MdOutlineScore } from "react-icons/md";
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
    <div className="flex items-start gap-3">
      <Icon size={16} className="mt-0.5 text-[var(--accent)]" />
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          {label}
        </p>
        <p className="font-medium text-[var(--ink)]">{value || "—"}</p>
      </div>
    </div>
  );
}

export function LeadSidebar({ leadData, summary, sessionId }: Props) {
  const lead = leadData?.lead;
  const score = leadData?.score ?? 0;

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Session
        </p>
        <p className="mt-1 break-all font-mono text-xs text-[var(--ink)]">
          {sessionId || "—"}
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--ink)] p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm text-white/70">
            <MdOutlineScore size={18} />
            Lead score
          </span>
          <span className="text-3xl font-semibold tabular-nums">{score}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/80">
          Intent:{" "}
          <span className="font-medium text-white">
            {leadData?.intent || "researching"}
          </span>
        </p>
      </div>

      <div className="space-y-4 rounded-2xl bg-white/70 p-5 ring-1 ring-[var(--line)] backdrop-blur">
        <h3 className="inline-flex items-center gap-2 font-semibold text-[var(--ink)]">
          <BadgeCheck size={18} className="text-[var(--accent)]" />
          Lead profile
        </h3>
        <Field icon={UserRound} label="Name" value={lead?.name} />
        <Field icon={Mail} label="Email" value={lead?.email} />
        <Field icon={Building2} label="Company" value={lead?.company} />
        <Field icon={Target} label="Role" value={lead?.role} />
        <Field icon={Zap} label="Industry" value={lead?.industry} />
      </div>

      <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-[var(--line)] backdrop-blur">
        <h3 className="mb-3 font-semibold text-[var(--ink)]">Signals</h3>
        <ul className="space-y-2">
          {(leadData?.top_signals?.length
            ? leadData.top_signals
            : ["Start chatting to collect signals"]
          ).map((signal) => (
            <li
              key={signal}
              className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)]"
            >
              {signal}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-[var(--line)] backdrop-blur">
        <h3 className="mb-2 inline-flex items-center gap-2 font-semibold text-[var(--ink)]">
          <Tags size={18} className="text-[var(--accent)]" />
          CRM tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {(leadData?.crm_tags?.length ? leadData.crm_tags : ["pending"]).map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]"
              >
                {tag}
              </span>
            )
          )}
        </div>
        {leadData?.recommended_action && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Next:{" "}
            <span className="font-medium text-[var(--ink)]">
              {leadData.recommended_action.replaceAll("_", " ")}
            </span>
            {leadData.explain ? ` — ${leadData.explain}` : ""}
          </p>
        )}
      </div>

      {summary && (
        <div className="rounded-2xl bg-white/70 p-5 ring-1 ring-[var(--line)] backdrop-blur">
          <h3 className="mb-2 font-semibold text-[var(--ink)]">Summary</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
            {summary}
          </p>
        </div>
      )}
    </aside>
  );
}
