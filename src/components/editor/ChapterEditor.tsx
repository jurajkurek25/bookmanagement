"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useEffect, useRef } from "react";
import type { Source } from "@/lib/book";
import { claimAttrs, skeletonNodes, type ClaimAttrs, type JNode } from "@/lib/doc";
import { newId } from "@/lib/supabase";
import { ClaimMark, Highlights, REFRESH, type DecorationOptions } from "./extensions";

type Props = {
  content: JNode;
  sourcesById: Map<string, Source>;
  showRules: boolean;
  onChange: (doc: JNode) => void;
  onActiveClaim: (claim: ClaimAttrs | null) => void;
  onReady: (editor: Editor) => void;
};

export function ChapterEditor({ content, sourcesById, showRules, onChange, onActiveClaim, onReady }: Props) {
  const opts = useRef<DecorationOptions>({ sourcesById, activeClaimId: null, showRules });
  const cb = useRef({ onChange, onActiveClaim });
  useEffect(() => {
    cb.current = { onChange, onActiveClaim };
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ code: false, codeBlock: false, horizontalRule: false, link: false, strike: false, underline: false, heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder: "Začni písať… alebo vlož kostru kapitoly." }),
      ClaimMark,
      // Funkcia sa volá až pri prekreslení editora, nie počas renderu Reactu.
      // eslint-disable-next-line react-hooks/refs
      Highlights.configure({ get: () => opts.current }),
    ],
    content,
    onUpdate: ({ editor }) => cb.current.onChange(editor.getJSON() as JNode),
    onSelectionUpdate: ({ editor }) => {
      const m = editor.state.selection.$from.marks().find((x) => x.type.name === "claim");
      const attrs = m ? claimAttrs({ type: "claim", attrs: m.attrs }) : null;
      if (attrs?.id !== opts.current.activeClaimId) {
        opts.current.activeClaimId = attrs?.id ?? null;
        editor.view.dispatch(editor.state.tr.setMeta(REFRESH, true));
      }
      cb.current.onActiveClaim(attrs);
    },
  });

  useEffect(() => {
    if (editor) onReady(editor);
  }, [editor, onReady]);

  useEffect(() => {
    opts.current = { ...opts.current, sourcesById, showRules };
    if (editor && !editor.isDestroyed) editor.view.dispatch(editor.state.tr.setMeta(REFRESH, true));
  }, [editor, sourcesById, showRules]);

  if (!editor) return null;

  const markClaim = () => {
    if (editor.state.selection.empty) return alert("Najprv označ text tvrdenia.");
    editor.chain().focus().setMark("claim", { id: newId(), opinion: false, sources: [] }).run();
  };

  const tool = (label: string, active: boolean, run: () => void, title?: string) => (
    <button
      type="button"
      title={title ?? label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`rounded px-2 py-1 text-sm ${active ? "bg-gold-soft text-ink" : "text-muted hover:text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="sticky top-[49px] z-10 mb-4 flex flex-wrap items-center gap-1 border-b border-line bg-bg/95 py-2 backdrop-blur">
        {tool("B", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Tučné")}
        {tool("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Kurzíva")}
        {tool("H2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Nadpis")}
        {tool("H3", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "Podnadpis")}
        {tool("• Zoznam", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run())}
        {tool("1. Zoznam", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run())}
        {tool("„ Citát", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run())}
        <span className="mx-1 h-5 w-px bg-line" />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={markClaim}
          className="rounded bg-gold px-2 py-1 text-sm font-medium text-surface hover:opacity-90"
        >
          Označiť tvrdenie
        </button>
        {tool("Vložiť kostru", false, () => editor.chain().focus().insertContent(skeletonNodes()).run(), "Otázka · Čo vieme · Čo vedeli predkovia · Úvaha · Kroky")}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
