"use client";

import { FormEvent, useState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { loginAccount, registerAccount } from "@/lib/api";
import { BrandLogo } from "./BrandLogo";

type AuthResult = {
  userKey: string;
  email: string;
  name?: string | null;
};

type Props = {
  onSuccess: (user: AuthResult) => void;
  onGuest: () => void;
};

export function LoginPage({ onSuccess, onGuest }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "signup"
          ? await registerAccount({ email, password, name })
          : await loginAccount({ email, password });
      onSuccess({
        userKey: result.user.userKey,
        email: result.user.email,
        name: result.user.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-atmosphere" />
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-[var(--blue)]/20 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-[var(--green)]/20 blur-3xl animate-drift-slow" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-fit">
            <BrandLogo
              size={72}
              className="rounded-[20px] shadow-lg shadow-[var(--blue)]/30"
            />
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--ink)]">
            Qualify<span className="text-[var(--blue)]">Bot</span>
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {mode === "login"
              ? "Sign in to your account"
              : "Create an account to save your chats"}
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="rounded-3xl border border-[var(--line)] bg-white/90 p-8 shadow-[0_24px_60px_rgba(31,41,55,0.08)] backdrop-blur-md"
        >
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-[var(--grey-soft)] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-[var(--blue)] shadow-sm"
                  : "text-[var(--muted)]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-[var(--green)] shadow-sm"
                  : "text-[var(--muted)]"
              }`}
            >
              Create account
            </button>
          </div>

          {mode === "signup" && (
            <label className="mb-4 block">
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
                <UserRound size={14} className="text-[var(--blue)]" />
                Name
              </span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/25"
                placeholder="Your name"
              />
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
              <Mail size={14} className="text-[var(--blue)]" />
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--blue)] focus:ring-2 focus:ring-[var(--blue)]/25"
              placeholder="you@company.com"
            />
          </label>

          <label className="mb-5 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]">
              <Lock size={14} className="text-[var(--green)]" />
              Password
            </span>
            <input
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--green)] focus:ring-2 focus:ring-[var(--green)]/25"
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
            />
          </label>

          {error && (
            <p className="mb-4 rounded-xl border border-[var(--blue)]/25 bg-[var(--blue-soft)] px-3 py-2 text-sm text-[var(--blue-deep)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-md shadow-[var(--blue)]/20"
          >
            {submitting
              ? mode === "signup"
                ? "Creating…"
                : "Signing in…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--line)]" />
            <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
              or
            </span>
            <div className="h-px flex-1 bg-[var(--line)]" />
          </div>

          <button
            type="button"
            onClick={onGuest}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--green)]/35 bg-[var(--green-soft)] px-4 py-3 text-sm font-semibold text-[var(--green-deep)] transition hover:border-[var(--green)] hover:bg-[var(--green)]/10"
          >
            <UserRound size={16} />
            Continue as guest
          </button>
        </form>
      </div>
    </div>
  );
}
