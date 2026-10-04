import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/unlock";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/login?error=configuration", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const supabase = createClient();
  let success = false;
  if (code) success = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (hash && type && ["email", "signup"].includes(type)) success = !(await supabase.auth.verifyOtp({ token_hash: hash, type: type as EmailOtpType })).error;
  // Setelah konfirmasi email tetap minta kata sandi untuk membuka data anak.
  const next = safeNext(request.nextUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(success ? `/unlock?next=${encodeURIComponent(next)}` : "/login?error=confirmation", request.url));
}
