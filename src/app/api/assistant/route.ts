import Anthropic from "@anthropic-ai/sdk";
import { runTask, type Task, type TaskInput } from "@/lib/server/assistant";
import { requireUser } from "@/lib/server/auth";
import { searchPubmed } from "@/lib/server/lookup";

const TASKS: Task[] = ["summarize", "translate", "counter", "check", "query"];
const MAX_INPUT = 60_000;

export async function POST(req: Request) {
  const denied = await requireUser(req);
  if (denied) return denied;

  const body = (await req.json()) as { task: Task } & TaskInput;
  if (!TASKS.includes(body.task)) return Response.json({ error: "Neznáma úloha." }, { status: 400 });
  const size = (body.text ?? "").length + (body.claim ?? "").length + (body.topic ?? "").length;
  if (size === 0) return Response.json({ error: "Chýba text." }, { status: 400 });
  if (size > MAX_INPUT) return Response.json({ error: "Text je príliš dlhý — vlož len abstrakt alebo časť štúdie." }, { status: 400 });

  try {
    const result = await runTask(body.task, body);
    // Pri hľadaní súvisiacich štúdií vraciame skutočné záznamy z PubMed, nie výmysly modelu.
    if (body.task === "query") return Response.json({ query: result, results: await searchPubmed(result) });
    return Response.json({ result });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return Response.json({ error: "Chýba alebo je neplatný ANTHROPIC_API_KEY." }, { status: 500 });
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: "Príliš veľa požiadaviek, skús o chvíľu." }, { status: 429 });
    if (e instanceof Anthropic.APIError) return Response.json({ error: `Chyba Claude API (${e.status}).` }, { status: 502 });
    return Response.json({ error: e instanceof Error ? e.message : "Neznáma chyba." }, { status: 500 });
  }
}
