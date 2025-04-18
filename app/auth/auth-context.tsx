"use client";

import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@prisma/client";
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

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isError: boolean;
  signIn: (params: SignInParams) => Promise<{ error: Error | null }>;
  signUp: (params: SignUpParams) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (
    params: ResetPasswordParams,
  ) => Promise<{ error: Error | null }>;
  updatePassword: (
    params: UpdatePasswordParams,
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
        console.error("Error fetching user:", error);
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

  // Mutación: iniciar sesión
  const { mutateAsync: signInAsync } = useMutation({
    mutationFn: async ({ email, password }: SignInParams) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    },
    onSuccess: () => {
      // Invalidar consultas para refrescar datos
      void queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });

  // Mutación: registrarse
  const { mutateAsync: signUpAsync } = useMutation({
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
  });

  // Mutación: cerrar sesión
  const { mutateAsync: signOutAsync } = useMutation({
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
    },
  });

  // Mutación: restablecer contraseña
  const { mutateAsync: resetPasswordAsync } = useMutation({
    mutationFn: async ({ email }: ResetPasswordParams) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error as Error | null };
    },
  });

  // Mutación: actualizar contraseña
  const { mutateAsync: updatePasswordAsync } = useMutation({
    mutationFn: async ({ password }: UpdatePasswordParams) => {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error: error as Error | null };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.user });
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
      } else {
        // Para otros eventos, invalidar consultas
        void queryClient.invalidateQueries({ queryKey: queryKeys.user });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Funciones expuestas al contexto
  // Fix: destructure mutateAsync antes de pasarlo a useCallback
  const signIn = useCallback(
    async (params: SignInParams) => {
      return signInAsync(params);
    },
    [signInAsync],
  );

  const signUp = useCallback(
    async (params: SignUpParams) => {
      return signUpAsync(params);
    },
    [signUpAsync],
  );

  const signOut = useCallback(async () => {
    await signOutAsync();
  }, [signOutAsync]);

  const resetPassword = useCallback(
    async (params: ResetPasswordParams) => {
      return resetPasswordAsync(params);
    },
    [resetPasswordAsync],
  );

  const updatePassword = useCallback(
    async (params: UpdatePasswordParams) => {
      return updatePasswordAsync(params);
    },
    [updatePasswordAsync],
  );

  const refreshUser = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.user }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userRole }),
    ]);
    // Al no devolver nada, la función retorna Promise<void> implícitamente
  }, [queryClient]);

  // Determinar estado de carga combinado
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
