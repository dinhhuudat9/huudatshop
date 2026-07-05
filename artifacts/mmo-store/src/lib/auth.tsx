import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mmo_store_token"));
  const queryClient = useQueryClient();

  // Custom fetch is configured to use this token automatically if we set it in localStorage.
  // We just need to trigger a refetch of the user if token exists.
  
  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      // Token might be invalid or expired
      logout();
    }
  }, [error]);

  const login = (newToken: string, user: User) => {
    localStorage.setItem("mmo_store_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(getGetMeQueryKey(), user);
  };

  const logout = () => {
    localStorage.removeItem("mmo_store_token");
    setToken(null);
    queryClient.setQueryData(getGetMeQueryKey(), null);
    queryClient.invalidateQueries();
  };

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{
      user: user || null,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
