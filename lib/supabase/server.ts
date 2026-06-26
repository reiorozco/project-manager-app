import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function createClient(request: NextRequest | null = null) {
  const cookieStore = await cookies();

  // Base configuration
  const config: {
    cookies: {
      getAll: () => { name: string; value: string }[];
      setAll: (
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
      ) => void;
    };
    global?: {
      headers: {
        Authorization: string;
      };
    };
  } = {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  };

  // If a request is provided, look for the Authorization header
  if (request) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (token) {
      // If there is a Bearer token, add it to the global configuration
      config.global = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    config,
  );
}
