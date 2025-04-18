import { type EmailOtpType } from "@supabase/supabase-js";

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const redirect_to = searchParams.get("redirect_to");
  const next = searchParams.get("next") ?? "/";

  console.log("Confirm route searchParams: ", searchParams);

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to the specified redirect URL or root of the app
      const redirectUrl = redirect_to ? `${redirect_to}` : next;

      redirect(redirectUrl);
    }
  }

  // redirect the user to an error page with some instructions
  redirect("/error");
}
