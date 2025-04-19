"use client";

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@/generated/prisma";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

type SignInParams = {
  email: string;
  password: string;
};

type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

type ResetPasswordParams = {
  email: string;
};

type UpdatePasswordParams = {
  password: string;
};

type AuthOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isError: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  isResettingPassword: boolean;
  isUpdatingPassword: boolean;
  signIn: (
    params: SignInParams,
    options?: AuthOptions,
  ) => Promise<{ error: Error | null }>;
  signUp: (
    params: SignUpParams,
    options?: AuthOptions,
  ) => Promise<{ error: Error | null }>;
  signOut: (options?: AuthOptions) => Promise<void>;
  resetPassword: (
    params: ResetPasswordParams,
    options?: AuthOptions,
  ) => Promise<{ error: Error | null }>;
  updatePassword: (
    params: UpdatePasswordParams,
    options?: AuthOptions,
  ) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  supabase: ReturnType<typeof createClient>;
};

// Query keys
const queryKeys = {
  user: ["auth", "user"] as const,
  userRole: ["auth", "userRole"] as const,
};

// Creamos una única instancia del cliente Supabase para toda la aplicación
const supabase = createClient();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();

  // Obtener usuario actual
  const userQuery: UseQueryResult<User | null> = useQuery({
    queryKey: queryKeys.user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user;
      } catch (error) {
        console.log("Error fetching user:", error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const userId = userQuery.data?.id;

  // Obtener rol de usuario cuando hay un usuario autenticado
  const userRoleQuery: UseQueryResult<UserRole | null> = useQuery({
    queryKey: [...queryKeys.userRole, userId],
    queryFn: async () => {
      if (!userId) return null;

      try {
        const { data, error } = await supabase
          .from("User")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) throw error;
        return data?.role || null;
      } catch (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
    },
    enabled: !!userId, // Solo ejecutar cuando hay un usuario
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Variables para almacenar callbacks externos
  // Usamos refs para mantener las referencias estables entre renderizados
  const signInSuccessCallback = useRef<(() => void) | undefined>(undefined);
  const signInErrorCallback = useRef<((error: Error) => void) | undefined>(
    undefined,
  );

  // Mutación: iniciar sesión
  const { mutateAsync: signInAsync, isPending: isSigningIn } = useMutation({
    mutationFn: async ({ email, password }: SignInParams) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    },
    onSuccess: (result) => {
      // Invalidar consultas para refrescar datos
      void queryClient.invalidateQueries({ queryKey: queryKeys.user });

      if (!result.error && signInSuccessCallback.current) {
        signInSuccessCallback.current();
      }
      signInSuccessCallback.current = undefined;
    },
    onError: (error) => {
      if (signInErrorCallback.current) {
        signInErrorCallback.current(error as Error);
      }
      signInErrorCallback.current = undefined;
    },
  });

  const signUpSuccessCallback = useRef<(() => void) | undefined>(undefined);
  const signUpErrorCallback = useRef<((error: Error) => void) | undefined>(
    undefined,
  );

  const { mutateAsync: signUpAsync, isPending: isSigningUp } = useMutation({
    mutationFn: async ({ email, password, fullName, role }: SignUpParams) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error: error as Error | null };
    },
    onSuccess: (result) => {
      if (!result.error && signUpSuccessCallback.current) {
        signUpSuccessCallback.current();
      }
      signUpSuccessCallback.current = undefined;
    },
    onError: (error) => {
      if (signUpErrorCallback.current) {
        signUpErrorCallback.current(error as Error);
      }
      signUpErrorCallback.current = undefined;
    },
  });

  const signOutSuccessCallback = useRef<(() => void) | undefined>(undefined);
  const signOutErrorCallback = useRef<((error: Error) => void) | undefined>(
    undefined,
  );

  const { mutateAsync: signOutAsync, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      console.log("Signing out...");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }

      console.log("Sign out successful");
    },
    onSuccess: () => {
      // Resetear el estado manual e inmediatamente
      queryClient.setQueryData(queryKeys.user, null);
      queryClient.setQueryData(queryKeys.userRole, null);

      queryClient.removeQueries({ queryKey: ["projects"] });

      if (signOutSuccessCallback.current) {
        signOutSuccessCallback.current();
      }
      signOutSuccessCallback.current = undefined;
    },
    onError: (error) => {
      if (signOutErrorCallback.current) {
        signOutErrorCallback.current(error as Error);
      }
      signOutErrorCallback.current = undefined;
    },
  });

  const resetPasswordSuccessCallback = useRef<(() => void) | undefined>(
    undefined,
  );
  const resetPasswordErrorCallback = useRef<
    ((error: Error) => void) | undefined
  >(undefined);

  const { mutateAsync: resetPasswordAsync, isPending: isResettingPassword } =
    useMutation({
      mutationFn: async ({ email }: ResetPasswordParams) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error: error as Error | null };
      },
      onSuccess: (result) => {
        if (!result.error && resetPasswordSuccessCallback.current) {
          resetPasswordSuccessCallback.current();
        }
        resetPasswordSuccessCallback.current = undefined;
      },
      onError: (error) => {
        if (resetPasswordErrorCallback.current) {
          resetPasswordErrorCallback.current(error as Error);
        }
        resetPasswordErrorCallback.current = undefined;
      },
    });

  const updatePasswordSuccessCallback = useRef<(() => void) | undefined>(
    undefined,
  );
  const updatePasswordErrorCallback = useRef<
    ((error: Error) => void) | undefined
  >(undefined);

  const { mutateAsync: updatePasswordAsync, isPending: isUpdatingPassword } =
    useMutation({
      mutationFn: async ({ password }: UpdatePasswordParams) => {
        const { error } = await supabase.auth.updateUser({
          password,
        });
        return { error: error as Error | null };
      },
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.user });

        if (!result.error && updatePasswordSuccessCallback.current) {
          updatePasswordSuccessCallback.current();
        }
        updatePasswordSuccessCallback.current = undefined;
      },
      onError: (error) => {
        if (updatePasswordErrorCallback.current) {
          updatePasswordErrorCallback.current(error as Error);
        }
        updatePasswordErrorCallback.current = undefined;
      },
    });

  // Escuchar cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (event === "SIGNED_OUT") {
        // Resetear estado inmediatamente
        queryClient.setQueryData(queryKeys.user, null);
        queryClient.setQueryData(queryKeys.userRole, null);

        // Limpiar datos relacionados con el usuario
        queryClient.removeQueries({ queryKey: ["projects"] });
      } else {
        // Para otros eventos, invalidar consultas
        void queryClient.invalidateQueries({ queryKey: queryKeys.user });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Funciones expuestas al contexto con soporte para callbacks
  const signIn = useCallback(
    async (params: SignInParams, options?: AuthOptions) => {
      signInSuccessCallback.current = options?.onSuccess;
      signInErrorCallback.current = options?.onError;

      return signInAsync(params);
    },
    [signInAsync],
  );

  const signUp = useCallback(
    async (params: SignUpParams, options?: AuthOptions) => {
      signUpSuccessCallback.current = options?.onSuccess;
      signUpErrorCallback.current = options?.onError;

      return signUpAsync(params);
    },
    [signUpAsync],
  );

  const signOut = useCallback(
    async (options?: AuthOptions) => {
      signOutSuccessCallback.current = options?.onSuccess;
      signOutErrorCallback.current = options?.onError;

      await signOutAsync();
    },
    [signOutAsync],
  );

  const resetPassword = useCallback(
    async (params: ResetPasswordParams, options?: AuthOptions) => {
      resetPasswordSuccessCallback.current = options?.onSuccess;
      resetPasswordErrorCallback.current = options?.onError;

      return resetPasswordAsync(params);
    },
    [resetPasswordAsync],
  );

  const updatePassword = useCallback(
    async (params: UpdatePasswordParams, options?: AuthOptions) => {
      updatePasswordSuccessCallback.current = options?.onSuccess;
      updatePasswordErrorCallback.current = options?.onError;

      return updatePasswordAsync(params);
    },
    [updatePasswordAsync],
  );

  const refreshUser = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userRole }),
    ]);
  }, [queryClient]);

  // Determinar estado de carga combinado para consultas
  const isLoading =
    userQuery.isLoading ||
    userRoleQuery.isLoading ||
    userQuery.isFetching ||
    userRoleQuery.isFetching;

  // Determinar estado de error combinado
  const isError = userQuery.isError || userRoleQuery.isError;

  return (
    <AuthContext.Provider
      value={{
        user: userQuery.data || null,
        userRole: userRoleQuery.data || null,
        isLoading,
        isError,
        isSigningIn,
        isSigningUp,
        isSigningOut,
        isResettingPassword,
        isUpdatingPassword,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshUser,
        supabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
