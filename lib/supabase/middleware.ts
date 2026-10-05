import type { Database } from "./database.types";
import { supabaseKey } from "./config";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Menyegarkan sesi Supabase di setiap permintaan (pola @supabase/ssr) dan mengembalikan pengguna saat ini. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const authHeaders = new Map<string, string>();

  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list: { name: string; value: string; options: CookieOptions }[], cacheHeaders: Record<string, string>) {
        Object.entries(cacheHeaders).forEach(([key, value]) => authHeaders.set(key, value));
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        authHeaders.forEach((value, key) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return { response: () => response, user: data.user };
}
