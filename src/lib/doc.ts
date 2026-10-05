// Práca s obsahom kapitoly uloženým ako JSON z editora (TipTap / ProseMirror).

export type JMark = { type: string; attrs?: Record<string, unknown> };
export type JNode = { type: string; attrs?: Record<string, unknown>; content?: JNode[]; text?: string; marks?: JMark[] };

export type ClaimAttrs = { id: string; opinion: boolean; sources: string[] };
export type Claim = ClaimAttrs & { text: string };

// Uzly, ktorých deti sú bloky (oddeľujeme ich novým riadkom).
const CONTAINERS = new Set(["doc", "blockquote", "listItem", "bulletList", "orderedList"]);

export function emptyDoc(): JNode {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export function docText(node: JNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  return (node.content ?? []).map(docText).join(CONTAINERS.has(node.type) ? "\n" : "");
}

export function wordCount(text: string): number {
  const m = text.match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
}

export function claimAttrs(mark: JMark): ClaimAttrs {
  const a = mark.attrs ?? {};
  return {
    id: String(a.id ?? ""),
    opinion: Boolean(a.opinion),
    sources: Array.isArray(a.sources) ? a.sources.map(String) : [],
  };
}

// Tvrdenie môže byť rozdelené na viac textových uzlov (napr. časť je tučná) — spájame podľa id.
export function extractClaims(doc: JNode): Claim[] {
  const byId = new Map<string, Claim>();
  const walk = (n: JNode) => {
    if (n.type === "text") {
      const m = n.marks?.find((x) => x.type === "claim");
      if (!m) return;
      const attrs = claimAttrs(m);
      const existing = byId.get(attrs.id);
      if (existing) existing.text += n.text ?? "";
      else byId.set(attrs.id, { ...attrs, text: n.text ?? "" });
      return;
    }
    n.content?.forEach(walk);
  };
  walk(doc);
  return [...byId.values()];
}

// Kostra kapitoly — voliteľná, autor ju môže prepísať alebo zmazať.
export const SKELETON_HEADINGS = [
  "Otázka alebo príbeh",
  "Čo vieme",
  "Čo vedeli predkovia",
  "Úvaha",
  "Kroky",
];

export function skeletonNodes(): JNode[] {
  return SKELETON_HEADINGS.flatMap((h) => [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: h }] },
    { type: "paragraph" },
  ]);
}
