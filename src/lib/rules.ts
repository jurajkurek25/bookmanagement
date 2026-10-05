// Kontrola textu: žargón, tón knihy a citlivé témy.
// Nič neprepisuje — len ukazuje miesta a dôvod.

export type RuleCategory = "zargon" | "ton" | "citlive";

export type Rule = {
  id: string;
  category: RuleCategory;
  // Regex bez hraníc slova; hranice sa pridajú automaticky.
  pattern: string;
  message: string;
};

export type Issue = { ruleId: string; category: RuleCategory; from: number; to: number; match: string; message: string };

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  zargon: "Žargón",
  ton: "Tón knihy",
  citlive: "Citlivá téma",
};

const L = "\\p{L}*"; // ľubovoľná koncovka (skloňovanie)

export const RULES: Rule[] = [
  // Žargón: čitateľ nie je vedec.
  { id: "korelacia", category: "zargon", pattern: `korel[aá]c${L}`, message: "„Korelácia“ → napr. „súvisí s“, „idú ruka v ruke“." },
  { id: "kauzalita", category: "zargon", pattern: `kauz[aá]l${L}`, message: "„Kauzalita“ → „príčina a následok“." },
  { id: "metaanalyza", category: "zargon", pattern: `meta-?anal[ýy]z${L}`, message: "„Metaanalýza“ → „súhrn desiatok štúdií“." },
  { id: "signifikantny", category: "zargon", pattern: `signifikant${L}`, message: "„Signifikantný“ → „preukázateľný“, „výrazný“." },
  { id: "statisticky", category: "zargon", pattern: `štatistick${L}\\s+(?:významn|signifikant)${L}`, message: "„Štatisticky významný“ → „preukázateľný“." },
  { id: "longitudinalny", category: "zargon", pattern: `longitudin[aá]ln${L}`, message: "„Longitudinálna“ → „sledovali ľudí celé roky“." },
  { id: "kohorta", category: "zargon", pattern: `kohort${L}`, message: "„Kohorta“ → „skupina ľudí, ktorú sledovali“." },
  { id: "prevalencia", category: "zargon", pattern: `preval[eé]nc${L}`, message: "„Prevalencia“ → „ako často sa vyskytuje“." },
  { id: "incidencia", category: "zargon", pattern: `incid[eé]nc${L}`, message: "„Incidencia“ → „koľko nových prípadov pribudne“." },
  { id: "etiologia", category: "zargon", pattern: `etiol[oó]gi${L}`, message: "„Etiológia“ → „príčiny“." },
  { id: "kognitivny", category: "zargon", pattern: `kognit[ií]vn${L}`, message: "„Kognitívny“ → „myšlienkový“, „súvisiaci s myslením“." },
  { id: "afektivny", category: "zargon", pattern: `afekt[ií]vn${L}`, message: "„Afektívny“ → „citový“." },
  { id: "neuroplasticita", category: "zargon", pattern: `neuroplastic${L}`, message: "„Neuroplasticita“ → „schopnosť mozgu meniť sa“." },
  { id: "amygdala", category: "zargon", pattern: `amygdal${L}`, message: "Amygdala — vysvetli pri prvom použití (napr. „poplašné centrum mozgu“)." },
  { id: "prefrontalny", category: "zargon", pattern: `prefront[aá]ln${L}`, message: "Prefrontálna kôra — vysvetli („časť mozgu za čelom, ktorá plánuje a brzdí impulzy“)." },
  { id: "kortizol", category: "zargon", pattern: `kortizol${L}`, message: "Kortizol — vysvetli pri prvom použití („stresový hormón“)." },
  { id: "dopaminergny", category: "zargon", pattern: `(?:dopa|seroto)minergn${L}`, message: "Príliš odborné — opíš, čo sa deje, nie názov dráhy." },
  { id: "paradigma", category: "zargon", pattern: `paradigm${L}`, message: "„Paradigma“ → „spôsob pohľadu“." },
  { id: "implikacia", category: "zargon", pattern: `implik[aá]ci${L}`, message: "„Implikácia“ → „dôsledok“, „čo z toho vyplýva“." },
  { id: "empiricky", category: "zargon", pattern: `empiri${L}`, message: "„Empirický“ → „overený pozorovaním“." },
  { id: "operacionalizacia", category: "zargon", pattern: `operacionaliz${L}`, message: "Vedecký žargón — opíš to vlastnými slovami." },
  { id: "konstrukt", category: "zargon", pattern: `konštrukt${L}`, message: "„Konštrukt“ → „pojem“." },
  { id: "velkost-efektu", category: "zargon", pattern: `(?:veľkos${L}\\s+efekt${L}|efekt${L}\\s+veľkos${L})`, message: "„Veľkosť efektu“ → „ako veľmi to pomáha / škodí“." },
  { id: "regresia", category: "zargon", pattern: `regresn${L}`, message: "Štatistický pojem — povedz len, čo z analýzy vyšlo." },
  { id: "et-al", category: "zargon", pattern: `et\\.?\\s+al\\.?`, message: "„et al.“ patrí do poznámok, nie do textu. Zdroj označ ako tvrdenie." },
  { id: "p-hodnota", category: "zargon", pattern: `p\\s*[<=]\\s*0[.,]\\d+`, message: "P-hodnota nepatrí do textu pre čitateľa." },

  // Tón: kniha sa dištancuje od manosféry. Ak termín kritizuješ, je to v poriadku.
  { id: "alfa", category: "ton", pattern: `alf(?:a|u|ou|y|ách|ami|ovia|ov|ím|ích|)(?:\\s+sam${L})?`, message: "Manosférový pojem „alfa“. Ak ho kritizuješ, v poriadku; inak ho nahraď." },
  { id: "beta", category: "ton", pattern: `bet(?:a|u|ou|y)\\s+(?:sam|mu)${L}`, message: "Manosférový pojem „beta muž/samec“." },
  { id: "sigma", category: "ton", pattern: `sigm(?:a|u|ou|y)\\s+(?:sam|mu)${L}`, message: "Manosférový pojem „sigma“." },
  { id: "redpill", category: "ton", pattern: `(?:red|black|blue)[\\s-]?pill${L}`, message: "Manosférový pojem. Skontroluj, či ho kritizuješ, nie preberáš." },
  { id: "high-value", category: "ton", pattern: `high[\\s-]value`, message: "„High value man“ — jazyk manosféry, hodnotu muža tak kniha neurčuje." },
  { id: "hypergamia", category: "ton", pattern: `hypergam${L}`, message: "„Hypergamia“ — manosférový rámec. Opri sa o výskum, nie o tento pojem." },
  { id: "smv", category: "ton", pattern: `SMV|awalt|simp${L}|cuck${L}`, message: "Slang manosféry." },
  { id: "dominancia", category: "ton", pattern: `domin(?:anc|antn|ovať|uj)${L}`, message: "„Dominancia“ — kniha sľubuje, že nie je výzvou k dominancii. Skontroluj kontext." },
  { id: "ovladnut", category: "ton", pattern: `(?:ovládnu|podmani)${L}`, message: "„Ovládnuť / podmaniť“ — skontroluj, či nejde o ovládanie ľudí." },
  { id: "zeny-su", category: "ton", pattern: `(?:všetky\\s+)?ženy\\s+(?:sú|chcú|potrebujú|nemajú|nevedia)`, message: "Zovšeobecnenie o ženách. Kniha nie je útok na ženy — opri sa o výskum a buď konkrétny." },
  { id: "skutocny-muz", category: "ton", pattern: `(?:skutočn|prav)(?:ý|ého|ému|om|ým|í|ých|ými)\\s+mu(?:ž|ža|žovi|žom|ži|žov|žmi)`, message: "„Skutočný muž“ vylučuje — kniha hovorí o celom mužovi, nie o „pravom“." },

  // Citlivé témy: odporúčania WHO pre písanie o samovražde, nestigmatizujúci jazyk o závislosti.
  { id: "spachat", category: "citlive", pattern: `spáchal${L}\\s+samovra${L}|spáchani${L}\\s+samovra${L}|spáchať\\s+samovra${L}`, message: "WHO odporúča nepísať „spáchal samovraždu“ (znie ako zločin). Napr. „zomrel samovraždou“, „vzal si život“." },
  { id: "metoda", category: "citlive", pattern: `(?:obesi|obesen|predávkova|podrezal|podrezan|zastrelil\\s+sa|skočil\\s+(?:z|pod)|otrávil\\s+sa|tablet${L}\\s+naraz)${L}`, message: "Opis spôsobu. WHO odporúča spôsob samovraždy ani sebapoškodenia neopisovať." },
  { id: "pokus", category: "citlive", pattern: `(?:ne)?úspešn${L}\\s+(?:pokus${L}|samovra${L})`, message: "„(Ne)úspešný pokus“ — WHO odporúča tieto nálepky nepoužívať." },
  { id: "epidemia", category: "citlive", pattern: `(?:epidémi|vln)${L}\\s+samovra${L}`, message: "Senzačný jazyk o samovraždách — WHO odporúča vyhnúť sa mu." },
  { id: "fetak", category: "citlive", pattern: `feťá${L}|narkoman${L}|smažk${L}|závislák${L}|ožran${L}`, message: "Stigmatizujúce slovo. Napr. „človek so závislosťou“." },
];

const compiled = RULES.map((r) => ({
  rule: r,
  re: new RegExp(`(?<![\\p{L}\\p{N}])(?:${r.pattern})(?![\\p{L}\\p{N}])`, "giu"),
}));

export function analyze(text: string, categories?: RuleCategory[]): Issue[] {
  const issues: Issue[] = [];
  for (const { rule, re } of compiled) {
    if (categories && !categories.includes(rule.category)) continue;
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (!m[0]) continue;
      issues.push({ ruleId: rule.id, category: rule.category, from: m.index, to: m.index + m[0].length, match: m[0], message: rule.message });
    }
  }
  return issues.sort((a, b) => a.from - b.from);
}

const SUICIDE = /samovra|vzal\s+si\s+život|vziať\s+si\s+život|suicid/iu;
const HELP = /link[auy]\s+(?:dôvery|pomoci)|nezábudk|ipčko|116\s?123|0800|krízov/iu;

// Kontrola na úrovni celej kapitoly (nie konkrétneho slova).
export function chapterWarnings(text: string): string[] {
  const out: string[] = [];
  if (SUICIDE.test(text) && !HELP.test(text)) {
    out.push(
      "Kapitola hovorí o samovražde, ale nemá kontakt na pomoc. WHO odporúča pridať linku pomoci (over aktuálne číslo, napr. Linka dôvery Nezábudka, IPčko.sk) a ukázať, že pomoc existuje.",
    );
  }
  return out;
}
