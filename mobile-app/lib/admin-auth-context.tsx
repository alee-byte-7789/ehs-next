import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { adminApiClient } from "./admin-api-client";
import { adminTokenStorage } from "./admin-token-storage";

interface AdminAuthContextValue {
  isAdminSignedIn: boolean;
  checkingSession: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminSignedIn, setIsAdminSignedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    adminTokenStorage.getAccessToken().then((token) => {
      setIsAdminSignedIn(!!token);
      setCheckingSession(false);
    });
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      isAdminSignedIn,
      checkingSession,

      async login(email: string, password: string) {
        const { data } = await adminApiClient.post<{ access_token: string }>("/auth/admin/login", {
          email,
          password,
        });
        await adminTokenStorage.setAccessToken(data.access_token);
        setIsAdminSignedIn(true);
      },

      async logout() {
        await adminTokenStorage.clear();
        setIsAdminSignedIn(false);
      },
    }),
    [isAdminSignedIn, checkingSession]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
