"use client";

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@prisma/client";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos una única instancia del cliente Supabase para toda la aplicación
const supabase = createClient();

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para actualizar el usuario y su rol
  const updateUserAndRole = useCallback(async (currentUser: User | null) => {
    // Actualizar inmediatamente el usuario para evitar problemas de UI
    setUser(currentUser);

    if (!currentUser) {
      setUserRole(null);
      return;
    }

    try {
      // Obtener el rol del usuario
      const { data } = await supabase
        .from("User")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      setUserRole(data?.role || null);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    }
  }, []);

  // Función para refrescar los datos del usuario actual
  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      await updateUserAndRole(data.user);
    } catch (error) {
      console.error("Error refreshing user:", error);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateUserAndRole]);

  // Inicializar autenticación y configurar listener
  useEffect(() => {
    let mounted = true;

    // Verificar autenticación inicial
    const initAuth = async () => {
      setIsLoading(true);
      try {
        // Usar getUser() como recomienda Supabase para autenticación segura
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          await updateUserAndRole(data.user);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void initAuth();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (mounted) {
        setIsLoading(true);
      }

      try {
        if (event === "SIGNED_OUT") {
          // Manejar específicamente el evento de cierre de sesión
          if (mounted) {
            setUser(null);
            setUserRole(null);
          }
        } else {
          // Para otros eventos, verificar con getUser
          const { data } = await supabase.auth.getUser();
          if (mounted) {
            await updateUserAndRole(data.user);
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        if (mounted) {
          setUser(null);
          setUserRole(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    });

    // Limpiar suscripción al desmontar
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateUserAndRole]);

  // Función para iniciar sesión
  const signIn = async ({ email, password }: SignInParams) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      // Nota: onAuthStateChange actualizará isLoading
    }
  };

  // Función para registrarse
  const signUp = async ({ email, password, fullName, role }: SignUpParams) => {
    setIsLoading(true);
    try {
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
    } catch (err) {
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    console.log("Signing out...");
    setIsLoading(true);

    try {
      // Limpiar manualmente el estado primero
      setUser(null);
      setUserRole(null);

      // Luego cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during sign out:", error);
        throw error;
      }

      console.log("Sign out successful");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Asegurarnos de que isLoading sea false
      setIsLoading(false);
    }
  };

  // Función para solicitar restablecimiento de contraseña
  const resetPassword = async ({ email }: ResetPasswordParams) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };

  // Función para actualizar contraseña
  const updatePassword = async ({ password }: UpdatePasswordParams) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoading,
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
