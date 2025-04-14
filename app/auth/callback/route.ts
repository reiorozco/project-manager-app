import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  console.log("Callback route origin: ", origin);

  // Get the current user after authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("User found...");

  if (user) {
    try {
      // Check if the user already exists in the database
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      if (!existingUser) {
        // Get user metadata (including role)
        const userData = user.user_metadata;

        // Create the user in our database
        await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || "",
            name: userData.full_name || null,
            role: userData.role || "CLIENT",
          },
        });
      }
    } catch (error) {
      console.error("Error synchronizing user: ", error);
    }
  }

  return NextResponse.redirect(origin + "/dashboard");
}
