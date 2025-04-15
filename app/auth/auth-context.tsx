"use client";

import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { UserRole } from "@prisma/client";

type AuthContextType = {
  user: User | null;
  userRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Creamos una única instancia del cliente Supabase para la aplicación
const supabase = createClient();

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Función para actualizar el usuario y su rol
  const updateUserAndRole = async (currentUser: User | null) => {
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
  };

  // Inicializar autenticación y configurar listener
  useEffect(() => {
    // Verificar autenticación inicial
    const initAuth = async () => {
      try {
        // Usar getUser() como recomienda Supabase para autenticación segura
        const { data } = await supabase.auth.getUser();
        await updateUserAndRole(data.user);
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setUserRole(null);
      }
    };

    void initAuth();

    // Suscribirse a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, _session) => {
      // IMPORTANTE: Siempre usar getUser() después de un cambio de estado
      // y NO usar directamente _session.user
      const { data } = await supabase.auth.getUser();
      await updateUserAndRole(data.user);
    });

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Función para iniciar sesión
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    setUser(null);
    setUserRole(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        signIn,
        signOut,
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
