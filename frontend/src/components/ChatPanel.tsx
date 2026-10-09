"use client";

import { FormEvent, useEffect, useRef } from "react";
import { Bot, Send, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";

type Props = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
};

export function ChatPanel({
  messages,
  input,
  loading,
  onInputChange,
  onSend,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSend();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={`${msg.role}-${idx}`}
              className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              {!isUser && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white shadow-sm">
                  <Bot size={15} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[var(--blue)] text-white shadow-sm shadow-[var(--blue)]/20"
                    : "bg-white text-[var(--ink)] shadow-sm ring-1 ring-[var(--line)]"
                }`}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--green-soft)] text-[var(--green)] ring-1 ring-[var(--green)]/20">
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <Bot size={14} className="animate-pulse text-[var(--blue)]" />
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex shrink-0 gap-2">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="e.g. I’m a VP Sales at Acme looking for lead scoring…"
          disabled={loading}
          className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/25 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          title="Send message"
          className="btn-primary inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium shadow-md shadow-[var(--blue)]/20"
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </section>
  );
}
