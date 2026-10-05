import { Extension, Mark, mergeAttributes } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type Transaction } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { claimColor, type Source } from "@/lib/book";
import { claimAttrs, type ClaimAttrs } from "@/lib/doc";
import { analyze, type Issue } from "@/lib/rules";

// Tvrdenie: označený úsek textu, ktorý sa odvoláva na zdroje (alebo je to autorov názor).
export const ClaimMark = Mark.create({
  name: "claim",
  inclusive: false,
  addAttributes() {
    return {
      id: { default: "" },
      opinion: { default: false },
      sources: { default: [] },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[data-claim]",
        getAttrs: (el) => {
          const e = el as HTMLElement;
          return { id: e.dataset.claim, opinion: e.dataset.opinion === "true", sources: JSON.parse(e.dataset.sources || "[]") };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { id, opinion, sources, ...rest } = HTMLAttributes;
    return ["span", mergeAttributes(rest, { "data-claim": id, "data-opinion": String(opinion), "data-sources": JSON.stringify(sources) }), 0];
  },
});

export type DecorationOptions = {
  sourcesById: Map<string, Source>;
  activeClaimId: string | null;
  showRules: boolean;
};

export type PositionedIssue = Issue & { pos: number; end: number };

// Nálezy kontroly s pozíciami v dokumente (pre zvýraznenie aj pre zoznam v paneli).
export function collectIssues(doc: PMNode): PositionedIssue[] {
  const out: PositionedIssue[] = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    // Listové uzly (napr. zalomenie riadku) sa nahradia 1 znakom, aby pozície sedeli.
    const text = node.textBetween(0, node.content.size, undefined, "￼");
    for (const i of analyze(text)) out.push({ ...i, pos: pos + 1 + i.from, end: pos + 1 + i.to });
    return false;
  });
  return out;
}

export function findClaimRange(doc: PMNode, id: string): { from: number; to: number } | null {
  let from = -1;
  let to = -1;
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const m = node.marks.find((x) => x.type.name === "claim" && x.attrs.id === id);
    if (m) {
      if (from < 0) from = pos;
      to = pos + node.nodeSize;
    }
    return false;
  });
  return from < 0 ? null : { from, to };
}

export function updateClaimTr(tr: Transaction, id: string, attrs: ClaimAttrs | null): Transaction {
  const range = findClaimRange(tr.doc, id);
  if (!range) return tr;
  const type = tr.doc.type.schema.marks.claim;
  tr.removeMark(range.from, range.to, type);
  if (attrs) tr.addMark(range.from, range.to, type.create(attrs));
  return tr;
}

const key = new PluginKey<DecorationSet>("dielna-decorations");
export const REFRESH = "dielna-refresh";

function build(doc: PMNode, o: DecorationOptions): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    const m = node.marks.find((x) => x.type.name === "claim");
    if (m) {
      const a = claimAttrs({ type: "claim", attrs: m.attrs });
      const color = claimColor(a, o.sourcesById);
      decos.push(Decoration.inline(pos, pos + node.nodeSize, { class: `claim claim-${color}${a.id === o.activeClaimId ? " claim-active" : ""}` }));
    }
    return false;
  });
  if (o.showRules) {
    for (const i of collectIssues(doc)) decos.push(Decoration.inline(i.pos, i.end, { class: `rule rule-${i.category}`, title: i.message }));
  }
  return DecorationSet.create(doc, decos);
}

export const Highlights = Extension.create<{ get: () => DecorationOptions }>({
  name: "dielnaHighlights",
  addOptions() {
    return { get: () => ({ sourcesById: new Map(), activeClaimId: null, showRules: true }) };
  },
  addProseMirrorPlugins() {
    const get = this.options.get;
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_, state) => build(state.doc, get()),
          apply: (tr, old) => (tr.docChanged || tr.getMeta(REFRESH) ? build(tr.doc, get()) : old),
        },
        props: { decorations: (state) => key.getState(state) },
      }),
    ];
  },
});
