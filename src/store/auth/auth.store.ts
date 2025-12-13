import { create } from "zustand";

import { API_BASE_URL } from "@/config";
import { apiRequest } from "@/shared/helpers/apiRequest";

const STORAGE_KEY = "sgo.auth.session";

export interface AuthUser {
  username: string;
  displayName: string;
  role?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

interface LoginPayload {
  username: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  loading: boolean;
  error: string | null;

  login: (payload: LoginPayload) => Promise<boolean>;
  logout: () => void;
  hydrate: () => void;
}

const LOCAL_USERS: Array<LoginPayload & Omit<AuthUser, "username">> = [
  {
    username: "admin",
    password: "admin123",
    displayName: "Administrador",
    role: "admin",
  },
  {
    username: "demo",
    password: "demo123",
    displayName: "Invitado",
    role: "viewer",
  },
];

const isAuthSession = (value: unknown): value is AuthSession =>
  !!value &&
  typeof value === "object" &&
  "token" in value &&
  "user" in value &&
  typeof (value as any).token === "string";

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

const authenticateLocally = ({ username, password }: LoginPayload) => {
  const match = LOCAL_USERS.find(
    (candidate) =>
      candidate.username.toLowerCase() === username.toLowerCase() &&
      candidate.password === password
  );

  if (!match) return null;

  const session: AuthSession = {
    token: `local-${match.username}-${Date.now()}`,
    user: {
      username: match.username,
      displayName: match.displayName,
      role: match.role,
    },
  };

  return session;
};

export const useAuthStore = create<AuthState>((set, get) => {
  const storedSession = readSessionFromStorage();

  return {
    user: storedSession?.user ?? null,
    token: storedSession?.token ?? null,
    isAuthenticated: !!storedSession?.token,
    hydrated: !!storedSession,
    loading: false,
    error: null,

    hydrate: () => {
      if (get().hydrated) return;
      const session = readSessionFromStorage();
      if (session) {
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          hydrated: true,
        });
      } else {
        set({ user: null, token: null, isAuthenticated: false, hydrated: true });
      }
    },

    login: async ({ username, password }) => {
      set({ loading: true, error: null });

      const requestPayload = {
        username,
        password,
      };

      // Por ahora solo modo local: no llamar API hasta que exista endpoint real.
      const session = authenticateLocally(requestPayload);

      if (!session) {
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

      persistSession(session);
      set({
        loading: false,
        isAuthenticated: true,
        user: session.user,
        token: session.token,
        hydrated: true,
        error: null,
      });

      return true;
    },

    logout: () => {
      clearSession();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        hydrated: true,
      });
    },
  };
});
