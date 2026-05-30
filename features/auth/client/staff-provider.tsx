"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "./use-session";
import type { UseSessionResult } from "@/features/auth/types";

const SessionContext = createContext<UseSessionResult | null>(null);

export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const value = useSession();

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error(
      "useSessionContext must be used within a SessionProvider",
    );
  }

  return value;
}
