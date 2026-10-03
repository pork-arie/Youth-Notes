import { createClient } from "@supabase/supabase-js";

const supaUrl = import.meta.env.VITE_SUPABASE_URL;
const supaKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supaUrl || !supaKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
}

// Online database + auth
export const db = createClient(supaUrl, supaKey);
