import { createClient } from "@supabase/supabase-js";

// API je len pre prihláseného autora — inak by ktokoľvek mohol míňať kredit na Claude API.
export async function requireUser(req: Request): Promise<Response | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Neprihlásený." }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "Neplatné prihlásenie." }, { status: 401 });
  return null;
}
