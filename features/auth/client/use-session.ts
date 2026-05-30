"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/auth/api-fetch";
import {
  type Session,
  type SessionResponse,
  type UseSessionResult,
} from "@/features/auth/types";
import { ACCESS_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/api/auth/api-fetch";
import { getStoredItem, removeStoredItem, setStoredItem } from "@/lib/api/auth/browser-storage";

type UseSessionOptions = {
  redirectToLogin?: boolean;
};

function isStoredSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Session>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.loginMode === "string" &&
    candidate.powerType !== undefined
  );
}

function readStoredSession(): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = getStoredItem(AUTH_USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isStoredSession(parsed)) {
      return parsed;
    }
  } catch {
    // Ignore malformed session cache and fall through to cleanup.
  }

  removeStoredItem(AUTH_USER_KEY);
  return null;
}

function getLoginRedirectPath() {
  if (typeof window === "undefined") {
    return "/en/login";
  }

  const locale = window.location.pathname.split("/")[1];
  return locale === "fr" || locale === "ar" || locale === "en"
    ? `/${locale}/login`
    : "/en/login";
}

export function useSession(
  options: UseSessionOptions = {},
): UseSessionResult {
  const { redirectToLogin = true } = options;
  const router = useRouter();
  const hasInitializedRef = useRef(false);
  const inFlightRefreshRef = useRef<Promise<Session | null> | null>(null);
  const isMountedRef = useRef(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearSession = useCallback(() => {
    removeStoredItem(ACCESS_TOKEN_KEY);
    removeStoredItem(AUTH_USER_KEY);
    setSession(null);
  }, []);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    if (inFlightRefreshRef.current) {
      return inFlightRefreshRef.current;
    }

    const refreshPromise = (async () => {
      const storedSession = readStoredSession();

      if (isMountedRef.current) {
        setError(null);
        setIsLoading(storedSession == null);

        if (storedSession) {
          setSession(storedSession);
        }
      }

      try {
        const accessToken = getStoredItem(ACCESS_TOKEN_KEY);

        if (!accessToken && !storedSession && !redirectToLogin) {
          clearSession();
          return null;
        }

        const res = await apiFetch("/api/me", {
          method: "GET",
          auth: true,
        });

        const data: SessionResponse = await res.json().catch(() => ({
          ok: false,
          message: "Erreur lors de la lecture de la reponse",
        }));

        if (!res.ok || !data.ok || !data.user) {
          const message = data.message ?? "Session introuvable";

          if (res.status === 401 || res.status === 403) {
            clearSession();
            if (redirectToLogin) {
              router.replace(getLoginRedirectPath());
            }
            return null;
          }

          if (isMountedRef.current) {
            setError(message);
          }

          return storedSession;
        }

        setSession(data.user);
        setStoredItem(AUTH_USER_KEY, JSON.stringify(data.user));
        return data.user;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erreur inattendue";

        if (isMountedRef.current) {
          setError(message);
          if (storedSession) {
            setSession(storedSession);
          }
        }

        return storedSession;
      } finally {
        inFlightRefreshRef.current = null;
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    })();

    inFlightRefreshRef.current = refreshPromise;
    return refreshPromise;
  }, [clearSession, redirectToLogin, router]);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;
    void refreshSession();
  }, [refreshSession]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    error,
    setSession,
    clearSession,
    refreshSession,
  };
}
