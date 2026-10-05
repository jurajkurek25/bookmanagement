import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

// API je len pre prihláseného autora — inak by ktokoľvek mohol míňať kredit na Claude API.
export async function requireUser(req: Request): Promise<Response | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Neprihlásený." }, { status: 401 });
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "Neplatné prihlásenie." }, { status: 401 });
  return null;
}
