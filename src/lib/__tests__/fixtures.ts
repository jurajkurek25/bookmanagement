import type { Source } from "../book";
import type { JNode } from "../doc";

export function source(over: Partial<Source> & { id: string }): Source {
  return {
    kind: "studia", title: "Názov", authors: "", year: null, journal: "", doi: "", pmid: "", url: "",
    edition_note: "", discipline: "psychologia", evidence: "nezaradene", replication: "nezname",
    abstract: "", summary: "", plain: "", limitations: "", notes: "", ...over,
  };
}

export function claimText(text: string, id: string, sources: string[], opinion = false, extraMarks: JNode["marks"] = []): JNode {
  return { type: "text", text, marks: [...(extraMarks ?? []), { type: "claim", attrs: { id, opinion, sources } }] };
}

export const t = (text: string): JNode => ({ type: "text", text });
export const p = (...content: JNode[]): JNode => ({ type: "paragraph", content });
export const doc = (...content: JNode[]): JNode => ({ type: "doc", content });
