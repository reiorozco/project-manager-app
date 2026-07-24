"use client";

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { authClient } from "@/lib/auth-client";
import { UserRole } from "@/generated/prisma";
import { useQueryClient } from "@tanstack/react-query";

type SignInParams = { email: string; password: string };
type SignUpParams = { email: string; password: string; name: string };
type AuthOptions = { onSuccess?: () => void; onError?: (error: Error) => void };

type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified: boolean;
  image?: string | null;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
};

type AuthContextType = {
  user: SessionUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isError: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  signIn: (params: SignInParams, options?: AuthOptions) => Promise<{ error: Error | null }>;
  signUp: (params: SignUpParams, options?: AuthOptions) => Promise<{ error: Error | null }>;
  signOut: (options?: AuthOptions) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { data: session, isPending: isLoading, error, refetch } = authClient.useSession();

  const user = (session?.user as SessionUser | undefined) ?? null;
  const userRole = (user?.role as UserRole | undefined) ?? null;
  const isError = !!error;

  const signIn = useCallback(async (params: SignInParams, options?: AuthOptions) => {
    setIsSigningIn(true);
    try {
      const result = await authClient.signIn.email({ email: params.email, password: params.password });
      if (result.error) {
        const err = new Error(result.error.message || "Sign in failed");
        options?.onError?.(err);
        return { error: err };
      }
      options?.onSuccess?.();
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign in failed");
      options?.onError?.(error);
      return { error };
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signUp = useCallback(async (params: SignUpParams, options?: AuthOptions) => {
    setIsSigningUp(true);
    try {
      const result = await authClient.signUp.email({ email: params.email, password: params.password, name: params.name });
      if (result.error) {
        const err = new Error(result.error.message || "Sign up failed");
        options?.onError?.(err);
        return { error: err };
      }
      options?.onSuccess?.();
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign up failed");
      options?.onError?.(error);
      return { error };
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const signOut = useCallback(async (options?: AuthOptions) => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      queryClient.removeQueries({ queryKey: ["projects"] });
      options?.onSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Sign out failed");
      options?.onError?.(error);
    } finally {
      setIsSigningOut(false);
    }
  }, [queryClient]);

  const refreshUser = useCallback(async () => { await refetch(); }, [refetch]);

  return (
    <AuthContext.Provider value={{ user, userRole, isLoading, isError, isSigningIn, isSigningUp, isSigningOut, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
