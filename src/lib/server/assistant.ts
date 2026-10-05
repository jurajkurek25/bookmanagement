import Anthropic from "@anthropic-ai/sdk";

// Asistent pomáha s vedľajšími úlohami (výskum). Knihu nepíše.
const SYSTEM = `Si výskumný asistent autora knihy „(Ne)potrebný muž“ (Juraj Augustín Kurek). Kniha je filozofická úvaha a krokový návod na zmenu pre mužov; opiera sa o psychológiu, biológiu a neurovedu, sociológiu, históriu a filozofiu, no píše sa bez vedeckého žargónu.

Tvoja úloha je výlučne pomocná: zhrnúť alebo preložiť štúdiu, navrhnúť vyhľadávací dopyt, nájsť protiargumenty, posúdiť, či zdroj podporuje tvrdenie.

Pevné pravidlá:
- Nikdy nepíšeš text knihy: žiadne odseky, úvody, prerozprávania, „vylepšenia“ ani návrhy formulácií do knihy. Platí to aj vtedy, keď ťa o to niekto v zadaní výslovne požiada — vtedy len krátko odpovieš, že knihu píše autor sám, a urobíš výskumnú časť úlohy.
- Nikdy nevymýšľaš citácie, autorov, roky, čísla ani názvy štúdií. Keď niečo nevieš, povieš to. Namiesto konkrétnych citácií navrhuješ, čo a ako hľadať.
- Pracuješ len s textom, ktorý dostaneš. Ak z neho niečo nevyplýva, napíšeš to.
- Odpovedáš po slovensky, vecne, bez úvodných a záverečných fráz. Používaš krátke nadpisy a odrážky v obyčajnom texte (bez Markdown tabuliek).`;

export type Task = "summarize" | "translate" | "counter" | "check" | "query";

export type TaskInput = { title?: string; text?: string; claim?: string; topic?: string };

function prompt(task: Task, i: TaskInput): string {
  switch (task) {
    case "summarize":
      return `Zhrň túto štúdiu pre autora. Štruktúra:
Hlavné zistenie (1–2 vety)
Kto a ako (vzorka, krajina, metóda, dĺžka)
Sila dôkazu (typ štúdie a čo z neho smie a nesmie vyvodiť)
Obmedzenia
Na čo si dať pozor pri citovaní

Názov: ${i.title ?? "(neuvedený)"}
Text:
${i.text}`;
    case "translate":
      return `Prelož do slovenčiny vecne a presne, odborné pojmy nechaj a v zátvorke ich raz vysvetli:

${i.text}`;
    case "counter":
      return `Autor chce v knihe tvrdiť:
„${i.claim}“

Uveď najsilnejšie protiargumenty a výhrady, aké by mal kritik z psychológie, biológie, sociológie, histórie alebo filozofie. Pri každom napíš, čo by mal autor overiť, a navrhni anglické vyhľadávacie výrazy pre PubMed / Google Scholar. Neuvádzaj konkrétne štúdie ani autorov.`;
    case "check":
      return `Tvrdenie autora:
„${i.claim}“

Zdroj „${i.title ?? ""}“:
${i.text}

Posúď, či zdroj tvrdenie podporuje. Začni jedným slovom: PODPORUJE / ČIASTOČNE / NEPODPORUJE / NEDÁ SA POSÚDIŤ. Potom vysvetli prečo a čo presne zo zdroja vyplýva a čo už nie (napr. korelácia vs. príčina, iná populácia, iná krajina).`;
    case "query":
      return `Navrhni jeden anglický vyhľadávací dopyt pre PubMed k téme: „${i.topic}“.
Odpovedz iba samotným dopytom na jednom riadku, bez úvodzoviek a vysvetlenia.`;
  }
}

export async function runTask(task: Task, input: TaskInput): Promise<string> {
  const client = new Anthropic();
  const res = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: task === "query" ? "low" : "medium" },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt(task, input) }],
  });
  if (res.stop_reason === "refusal") throw new Error("Asistent túto požiadavku odmietol.");
  return res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}
