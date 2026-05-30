import type { LoginMode, PowerType } from "@/lib/generated/prisma/enums";

export type Session = {
  id: string;
  email: string;
  powerType: PowerType;
  loginMode: LoginMode;
};

export type SessionResponse = {
  ok: boolean;
  user?: Session;
  message?: string;
};

export type UseSessionResult = {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  clearSession: () => void;
  refreshSession: () => Promise<Session | null>;
};
