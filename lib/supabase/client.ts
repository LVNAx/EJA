import type { Database } from "./database.types";
import { supabaseKey } from "./config";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey());
}
