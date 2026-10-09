const AUTH_KEY = "qualifybot_session";
const GUEST_ID_KEY = "qualifybot_guest_id";

export type AuthSession = {
  userKey: string;
  email: string | null;
  name?: string | null;
  signedInAt: string;
  isGuest?: boolean;
  isAdmin?: boolean;
};

function makeGuestId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `g-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable unique guest id for this browser only — never shared across users */
export function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "guest:temp";
  let id = window.localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = makeGuestId();
    window.localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function getAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession> & { email?: string };

    // Migrate old sessions that only stored email / shared guest key
    if (!parsed.userKey) {
      if (parsed.isGuest || parsed.email === "guest@qualifybot.local") {
        return setGuestSession();
      }
      if (parsed.email) {
        return setAuthSession({
          userKey: `email:${parsed.email}`,
          email: parsed.email,
          isGuest: false,
        });
      }
      return null;
    }

    // Old shared guest key — force a unique guest for this browser
    if (
      parsed.isGuest &&
      (parsed.userKey === "guest" ||
        parsed.userKey === "guest@qualifybot.local" ||
        parsed.email === "guest@qualifybot.local")
    ) {
      return setGuestSession();
    }

    const session = parsed as AuthSession;
    // Keep admin flag in sync for known admin emails
    const email = session.email?.toLowerCase() || "";
    if (email === "admin@qualifybot.com" || email === "admin") {
      session.isAdmin = true;
    }
    return session;
  } catch {
    return null;
  }
}

export function setAuthSession(input: {
  userKey: string;
  email?: string | null;
  name?: string | null;
  isGuest?: boolean;
  isAdmin?: boolean;
}): AuthSession {
  const session: AuthSession = {
    userKey: input.userKey,
    email: input.email ?? null,
    name: input.name ?? null,
    signedInAt: new Date().toISOString(),
    isGuest: input.isGuest ?? false,
    isAdmin: input.isAdmin ?? false,
  };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return session;
}

export function setGuestSession(): AuthSession {
  const guestId = getOrCreateGuestId();
  return setAuthSession({
    userKey: `guest:${guestId}`,
    email: null,
    name: "Guest",
    isGuest: true,
  });
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_KEY);
  // Keep GUEST_ID_KEY so the same browser guest stays unique but separate from accounts
}
