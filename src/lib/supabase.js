import { createClient } from "@supabase/supabase-js";

const supaUrl = import.meta.env.VITE_SUPABASE_URL;
const supakey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if(!supaUrl || !supakey){
    throw new Error("missing env")
}

export const db = createClient(supaUrl,supakey);