import { create } from "zustand";

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

const STORAGE_KEY = "sgo.auth.session";
const SESSION_EXPIRED_MESSAGE = "Tu sesión expiró. Ingresa nuevamente.";

export interface AuthUser {
  id: string;
  personalId: string;
  area: string;
  username: string;
  displayName: string;
  companyId: string;
  companyName: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
  passwordExpiresAt: string | null;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  passwordExpiresAt: string | null;
  isPasswordExpired: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
  setPasswordExpiration: (value: string | null) => void;
}

interface LoginResponse {
  id: string;
  personalId: string;
  area: string;
  usuario: string;
  companiaId: string;
  razonSocial: string;
  fechaVencimientoClave?: string | null;
  token: string;
  expiresAtUtc?: string;
  expiresInSeconds?: number;
}

let sessionTimeoutId: number | null = null;

const isAuthSession = (value: unknown): value is AuthSession => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    "token" in candidate &&
    "user" in candidate &&
    "expiresAt" in candidate &&
    typeof candidate.token === "string"
  );
};

const readSessionFromStorage = (): AuthSession | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const persistSession = (session: AuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

const scheduleSessionExpiration = (expiresAt: number, onExpire: () => void) => {
  if (typeof window === "undefined") return;
  if (sessionTimeoutId) {
    window.clearTimeout(sessionTimeoutId);
  }

  const msUntilExpire = expiresAt - Date.now();
  if (msUntilExpire <= 0) {
    onExpire();
    return;
  }

  sessionTimeoutId = window.setTimeout(() => {
    onExpire();
  }, msUntilExpire);
};

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parsePasswordExpirationMs = (value?: string | null): number | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (DATE_ONLY_REGEX.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasPasswordExpired = (value?: string | null): boolean => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  const parsed = parsePasswordExpirationMs(raw);
  if (parsed === null) return false;

  if (DATE_ONLY_REGEX.test(raw)) {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    return todayStart >= parsed;
  }

  return Date.now() >= parsed;
};

export const useAuthStore = create<AuthState>((set, get) => {
  const storedSession = readSessionFromStorage();

  const isExpired = (expiresAt?: number | null) =>
    !expiresAt || expiresAt <= Date.now();

  const hasValidStoredSession =
    storedSession && !isExpired(storedSession.expiresAt);

  const logout = (reason?: string) => {
    if (sessionTimeoutId) {
      window.clearTimeout(sessionTimeoutId);
      sessionTimeoutId = null;
    }
    clearSession();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      passwordExpiresAt: null,
      isPasswordExpired: false,
      error: reason ?? null,
      hydrated: true,
    });
  };

  const hydrate = () => {
    if (get().hydrated) return;
    const session = readSessionFromStorage();
    if (session && !isExpired(session.expiresAt)) {
      const passwordExpiresAt = session.passwordExpiresAt ?? null;
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        passwordExpiresAt,
        isPasswordExpired: hasPasswordExpired(passwordExpiresAt),
        hydrated: true,
      });
      scheduleSessionExpiration(session.expiresAt, () => logout(SESSION_EXPIRED_MESSAGE));
    } else {
      logout(session ? SESSION_EXPIRED_MESSAGE : undefined);
    }
  };

  return {
    user: hasValidStoredSession ? storedSession?.user : null,
    token: hasValidStoredSession ? storedSession?.token : null,
    isAuthenticated: !!hasValidStoredSession,
    passwordExpiresAt: hasValidStoredSession
      ? (storedSession?.passwordExpiresAt ?? null)
      : null,
    isPasswordExpired: hasValidStoredSession
      ? hasPasswordExpired(storedSession?.passwordExpiresAt ?? null)
      : false,
    hydrated: false,
    loading: false,
    error: null,

    hydrate,

    setPasswordExpiration: (value) => {
      const normalized = value?.trim() ? value.trim() : null;
      const state = get();
      set({
        passwordExpiresAt: normalized,
        isPasswordExpired: hasPasswordExpired(normalized),
      });

      if (!state.user || !state.token || !state.isAuthenticated) return;

      const currentSession = readSessionFromStorage();
      const session: AuthSession = {
        token: state.token,
        user: state.user,
        expiresAt: currentSession?.expiresAt ?? Date.now() + 5 * 60 * 1000,
        passwordExpiresAt: normalized,
      };
      persistSession(session);
    },

    login: async ({ username, password }) => {
      set({ loading: true, error: null });

      const response = await apiRequest<LoginResponse>({
        url: `${API_BASE_URL}/User/acceso`,
        method: "POST",
        data: {
          email: username.trim(),
          password: password.trim(),
        },
      });

      const parsed = response as LoginResponse | null;

      if (!parsed || typeof parsed !== "object" || !parsed.token) {
        set({
          loading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          error: "Credenciales incorrectas",
          hydrated: true,
        });
        return false;
      }

      const expiresAt =
        (parsed.expiresAtUtc ? Date.parse(parsed.expiresAtUtc) : null) ??
        (parsed.expiresInSeconds
          ? Date.now() + parsed.expiresInSeconds * 1000
          : null);

      const session: AuthSession = {
        token: parsed.token,
        expiresAt: expiresAt ?? Date.now() + 5 * 60 * 1000, // fallback a 5 min si el API no envía expiración
        passwordExpiresAt: parsed.fechaVencimientoClave ?? null,
        user: {
          id: parsed.id,
          personalId: parsed.personalId,
          area: parsed.area,
          username,
          displayName: parsed.usuario ?? username,
          companyId: parsed.companiaId,
          companyName: parsed.razonSocial,
        },
      };

      persistSession(session);
      set({
        loading: false,
        isAuthenticated: true,
        user: session.user,
        token: session.token,
        passwordExpiresAt: session.passwordExpiresAt,
        isPasswordExpired: hasPasswordExpired(session.passwordExpiresAt),
        hydrated: true,
        error: null,
      });

      scheduleSessionExpiration(session.expiresAt, () =>
        logout(SESSION_EXPIRED_MESSAGE)
      );

      return true;
    },

    logout: () => logout(),
  };
});
