// Zostavenie rukopisu z kapitol — spoločný základ pre DOCX, ePub aj PDF.
// Značky tvrdení sa pri exporte menia na číslované poznámky na konci kapitoly.

import { BOOK_AUTHOR, BOOK_ORDER, BOOK_TITLE, formatCitation, type Exercise, type Source } from "./book";
import { claimAttrs, type JNode } from "./doc";

export type Run = { text: string; bold?: boolean; italic?: boolean } | { note: number };
export type MBlock =
  | { kind: "heading"; level: 2 | 3; runs: Run[] }
  | { kind: "p" | "quote" | "bullet" | "number"; runs: Run[] };
export type MChapter = { title: string; blocks: MBlock[]; notes: string[]; worksheet: Exercise[] };
export type MPart = { level: number; name: string; chapters: MChapter[] };
export type Manuscript = { title: string; author: string; parts: MPart[]; bibliography: string[] };

export type ChapterInput = { level: number; title: string; position: number; content: unknown; worksheet: Exercise[] };

export function buildManuscript(chapters: ChapterInput[], sources: Source[], opts: { onlyWorksheets?: boolean } = {}): Manuscript {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const cited = new Set<string>();

  const parts: MPart[] = BOOK_ORDER.map((lvl) => ({
    level: lvl.level,
    name: lvl.name,
    chapters: chapters
      .filter((c) => c.level === lvl.level)
      .sort((a, b) => a.position - b.position)
      .map((c) => {
        if (opts.onlyWorksheets) return { title: c.title, blocks: [], notes: [], worksheet: c.worksheet ?? [] };
        const notes: string[] = [];
        const blocks = convertBlocks(c.content as JNode, (ids) => {
          const found = ids.map((id) => byId.get(id)).filter((s): s is Source => !!s);
          if (found.length === 0) return null;
          found.forEach((s) => cited.add(s.id));
          notes.push(found.map(formatCitation).join(" "));
          return notes.length;
        });
        return { title: c.title, blocks, notes, worksheet: c.worksheet ?? [] };
      })
      .filter((c) => !opts.onlyWorksheets || c.worksheet.length > 0),
  })).filter((p) => p.chapters.length > 0);

  const bibliography = sources
    .filter((s) => cited.has(s.id))
    .map(formatCitation)
    .sort((a, b) => a.localeCompare(b, "sk"));

  return { title: BOOK_TITLE, author: BOOK_AUTHOR, parts, bibliography };
}

type NoteFor = (sourceIds: string[]) => number | null;

function convertBlocks(doc: JNode | undefined, noteFor: NoteFor): MBlock[] {
  const out: MBlock[] = [];
  const visit = (n: JNode, ctx: "p" | "quote" | "bullet" | "number") => {
    switch (n.type) {
      case "paragraph": {
        const runs = convertInline(n.content ?? [], noteFor);
        if (runs.length) out.push({ kind: ctx, runs });
        return;
      }
      case "heading": {
        const level = Number(n.attrs?.level ?? 2) >= 3 ? 3 : 2;
        const runs = convertInline(n.content ?? [], noteFor);
        if (runs.length) out.push({ kind: "heading", level, runs });
        return;
      }
      case "blockquote":
        return n.content?.forEach((c) => visit(c, "quote"));
      case "bulletList":
        return n.content?.forEach((c) => visit(c, "bullet"));
      case "orderedList":
        return n.content?.forEach((c) => visit(c, "number"));
      default:
        return n.content?.forEach((c) => visit(c, ctx));
    }
  };
  doc?.content?.forEach((c) => visit(c, "p"));
  return out;
}

function convertInline(nodes: JNode[], noteFor: NoteFor): Run[] {
  const runs: Run[] = [];
  let open: { id: string; opinion: boolean; sources: string[] } | null = null;
  const close = () => {
    if (open && !open.opinion && open.sources.length) {
      const n = noteFor(open.sources);
      if (n !== null) runs.push({ note: n });
    }
    open = null;
  };
  for (const n of nodes) {
    const claimMark = n.marks?.find((m) => m.type === "claim");
    const claim = claimMark ? claimAttrs(claimMark) : null;
    if (open && (!claim || claim.id !== (open as { id: string }).id)) close();
    if (claim && !open) open = claim;
    if (n.type === "text") {
      const bold = n.marks?.some((m) => m.type === "bold") || undefined;
      const italic = n.marks?.some((m) => m.type === "italic") || undefined;
      runs.push({ text: n.text ?? "", ...(bold && { bold }), ...(italic && { italic }) });
    } else if (n.type === "hardBreak") {
      runs.push({ text: "\n" });
    }
  }
  close();
  return runs;
}

// Spoločná podoba pracovného listu pre všetky formáty.
const LINE = "_______________________________________________";
export function exerciseScaffold(ex: Exercise): string[] {
  switch (ex.type) {
    case "reflexia":
      return [LINE, LINE, LINE, LINE];
    case "zavazok":
      return ["1. " + LINE, "2. " + LINE, "3. " + LINE, "", "Podpis a dátum: ____________________"];
    case "navyk":
      return ["Návyk: " + LINE, "", "Po ___   Ut ___   St ___   Št ___   Pi ___   So ___   Ne ___"];
    case "rozhovor":
      return ["S kým: " + LINE, "Otázka 1: " + LINE, "Otázka 2: " + LINE, "Čo som sa dozvedel: " + LINE];
    case "list":
      return [LINE, LINE, LINE, LINE, LINE, LINE];
  }
}

export function runText(r: Run): string {
  return "note" in r ? "" : r.text;
}
