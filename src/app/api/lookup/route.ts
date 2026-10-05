import { requireUser } from "@/lib/server/auth";
import { lookupDoi, lookupPmid, searchPubmed } from "@/lib/server/lookup";

// GET /api/lookup?doi=… | ?pmid=… | ?q=…
export async function GET(req: Request) {
  const denied = await requireUser(req);
  if (denied) return denied;

  const p = new URL(req.url).searchParams;
  try {
    if (p.get("q")) return Response.json({ results: await searchPubmed(p.get("q")!) });
    const found = p.get("doi") ? await lookupDoi(p.get("doi")!) : p.get("pmid") ? await lookupPmid(p.get("pmid")!) : undefined;
    if (found === undefined) return Response.json({ error: "Zadaj DOI alebo PMID." }, { status: 400 });
    if (!found) return Response.json({ error: "Takýto záznam neexistuje — skontroluj DOI/PMID." }, { status: 404 });
    return Response.json({ found });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Chyba pri overovaní." }, { status: 502 });
  }
}
