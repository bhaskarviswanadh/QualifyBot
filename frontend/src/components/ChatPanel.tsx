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
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSend();
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={`${msg.role}-${idx}`}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              {!isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                  <Bot size={18} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                  isUser
                    ? "bg-[var(--accent)] text-white"
                    : "bg-white/80 text-[var(--ink)] shadow-sm ring-1 ring-[var(--line)]"
                }`}
              >
                {msg.content}
              </div>
              {isUser && (
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <Bot size={16} className="animate-pulse" />
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Tell me about your role, company, or challenges…"
          disabled={loading}
          className="flex-1 rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3 font-medium text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={18} />
          Send
        </button>
      </form>
    </section>
  );
}
