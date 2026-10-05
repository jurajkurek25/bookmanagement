// Štruktúra knihy, číselníky a odvodené výpočty.

export const WORDS_PER_PAGE = 280;
export const BOOK_TITLE = "(Ne)potrebný muž";
export const BOOK_AUTHOR = "Juraj Augustín Kurek";

export type Level = { level: number; name: string; subtitle: string; defaultPages: number };

// Poradie podľa pyramídy: 1 je vrchol, 9 sú korene. Kniha ide zdola nahor (9 → 1).
export const LEVELS: Level[] = [
  { level: 1, name: "Transcendencia", subtitle: "Presah, odkaz, duchovno", defaultPages: 70 },
  { level: 2, name: "Vzťahy", subtitle: "Ľudské prepojenie · sexualita a príťažlivosť", defaultPages: 110 },
  { level: 3, name: "Zmysel, mentorstvo, otcovstvo", subtitle: "Srdce knihy", defaultPages: 120 },
  { level: 4, name: "Komunikácia a charizma", subtitle: "Ako sa hodnoty prenášajú do sveta", defaultPages: 90 },
  { level: 5, name: "Peniaze a majetok", subtitle: "Nástroj na stabilitu", defaultPages: 80 },
  { level: 6, name: "Praktické zručnosti", subtitle: "Postarať sa o seba a iných", defaultPages: 70 },
  { level: 7, name: "Telo", subtitle: "Fyzický základ", defaultPages: 80 },
  { level: 8, name: "Mentálne nastavenie", subtitle: "Vnútorná integrita · nice guy syndróm", defaultPages: 100 },
  { level: 9, name: "História mužnosti", subtitle: "Korene", defaultPages: 80 },
];

export const BOOK_ORDER = [...LEVELS].sort((a, b) => b.level - a.level);

export function levelOf(n: number): Level {
  const l = LEVELS.find((x) => x.level === n);
  if (!l) throw new Error(`Neznáma úroveň ${n}`);
  return l;
}

export const CHAPTER_STATUSES = [
  { id: "nacrt", label: "Náčrt" },
  { id: "vyskum", label: "Výskum" },
  { id: "pisanie", label: "Písanie" },
  { id: "revizia", label: "Revízia" },
  { id: "hotovo", label: "Hotovo" },
] as const;
export type ChapterStatus = (typeof CHAPTER_STATUSES)[number]["id"];

export const DISCIPLINES = [
  { id: "psychologia", label: "Psychológia" },
  { id: "biologia", label: "Biológia / neuroveda" },
  { id: "sociologia", label: "Sociológia" },
  { id: "historia", label: "História" },
  { id: "filozofia", label: "Filozofia" },
] as const;
export type Discipline = (typeof DISCIPLINES)[number]["id"];

// Zoradené od najsilnejšieho dôkazu.
export const EVIDENCE = [
  { id: "metaanalyza", label: "Metaanalýza", strong: true },
  { id: "rct", label: "Randomizovaný experiment", strong: true },
  { id: "longitudinalna", label: "Dlhodobá (longitudinálna)", strong: true },
  { id: "korelacna", label: "Korelačná", strong: false },
  { id: "kvalitativna", label: "Kvalitatívna", strong: false },
  { id: "historicky_pramen", label: "Historický prameň", strong: false },
  { id: "nazor", label: "Názor autora", strong: false },
  { id: "nezaradene", label: "Nezaradené", strong: false },
] as const;
export type Evidence = (typeof EVIDENCE)[number]["id"];

export const REPLICATION = [
  { id: "replikovane", label: "Replikované" },
  { id: "sporne", label: "Sporné" },
  { id: "neuspesna", label: "Neúspešná replikácia" },
  { id: "nezname", label: "Nevedno" },
] as const;
export type Replication = (typeof REPLICATION)[number]["id"];

export const SOURCE_KINDS = [
  { id: "studia", label: "Štúdia" },
  { id: "kniha", label: "Kniha" },
  { id: "historicky", label: "Historický prameň" },
  { id: "clanok", label: "Článok" },
  { id: "ine", label: "Iné" },
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number]["id"];

export function label<T extends { id: string; label: string }>(list: readonly T[], id: string): string {
  return list.find((x) => x.id === id)?.label ?? id;
}

export type Source = {
  id: string;
  kind: SourceKind;
  title: string;
  authors: string;
  year: number | null;
  journal: string;
  doi: string;
  pmid: string;
  url: string;
  edition_note: string;
  discipline: Discipline;
  evidence: Evidence;
  replication: Replication;
  abstract: string;
  summary: string;
  plain: string;
  limitations: string;
  notes: string;
};

export type ExerciseType = "reflexia" | "zavazok" | "navyk" | "rozhovor" | "list";
export type Exercise = { id: string; type: ExerciseType; title: string; instructions: string; sourceId?: string };

export const EXERCISE_TEMPLATES: { type: ExerciseType; label: string; title: string; instructions: string }[] = [
  { type: "reflexia", label: "Reflexná otázka", title: "Zastav sa", instructions: "Odpovedz úprimne, len pre seba:" },
  { type: "zavazok", label: "Záväzok na 7 dní", title: "Môj záväzok", instructions: "Na najbližších 7 dní sa zaväzujem:" },
  { type: "navyk", label: "Sledovanie návyku", title: "Sledujem návyk", instructions: "Každý deň, keď to urobíš, zaškrtni políčko." },
  { type: "rozhovor", label: "Rozhovor s niekým", title: "Rozhovor", instructions: "S kým sa porozprávaš a čo sa ho opýtaš:" },
  { type: "list", label: "List sebe", title: "List sebe", instructions: "Napíš list sebe o rok:" },
];

export type ChapterRow = {
  id: string;
  level: number;
  title: string;
  position: number;
  status: ChapterStatus;
  content: unknown;
  word_count: number;
  worksheet: Exercise[];
  notes: string;
  updated_at: string;
};

export function pages(words: number): number {
  return words / WORDS_PER_PAGE;
}

export function targetPagesFor(level: number, budgets: { level: number; target_pages: number }[]): number {
  return budgets.find((b) => b.level === level)?.target_pages ?? levelOf(level).defaultPages;
}

// Farba tvrdenia sa neurčuje ručne, ale zo zdrojov, o ktoré sa opiera.
export type ClaimColor = "green" | "yellow" | "red" | "opinion";

export function claimColor(
  claim: { opinion: boolean; sources: string[] },
  sourcesById: Map<string, Pick<Source, "evidence" | "replication">>,
): ClaimColor {
  if (claim.opinion) return "opinion";
  const found = claim.sources.map((id) => sourcesById.get(id)).filter((s) => s !== undefined);
  if (found.length === 0) return "red";
  const strong = found.some(
    (s) => EVIDENCE.find((e) => e.id === s.evidence)?.strong && s.replication !== "neuspesna" && s.replication !== "sporne",
  );
  return strong ? "green" : "yellow";
}

export const CLAIM_COLORS: Record<ClaimColor, { dot: string; label: string }> = {
  green: { dot: "🟢", label: "Podložené silným zdrojom" },
  yellow: { dot: "🟡", label: "Podložené slabo" },
  red: { dot: "🔴", label: "Bez zdroja" },
  opinion: { dot: "⚪", label: "Môj názor / skúsenosť" },
};

// Citácia v štýle blízkom APA.
export function formatCitation(s: Pick<Source, "kind" | "authors" | "year" | "title" | "journal" | "doi" | "url" | "edition_note">): string {
  const parts: string[] = [];
  const who = s.authors.trim();
  if (who) parts.push(s.year ? `${who} (${s.year}).` : `${who}.`);
  else if (s.year) parts.push(`(${s.year}).`);
  parts.push(s.title.trim().replace(/\.?$/, "."));
  if (s.journal.trim()) parts.push(s.journal.trim().replace(/\.?$/, "."));
  if (s.edition_note.trim()) parts.push(s.edition_note.trim().replace(/\.?$/, "."));
  if (s.doi.trim()) parts.push(`https://doi.org/${s.doi.trim()}`);
  else if (s.url.trim()) parts.push(s.url.trim());
  return parts.join(" ");
}
