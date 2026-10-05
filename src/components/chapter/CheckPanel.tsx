"use client";

import type { Editor } from "@tiptap/react";
import { CATEGORY_LABELS, chapterWarnings, type RuleCategory } from "@/lib/rules";
import { collectIssues } from "../editor/extensions";

export function CheckPanel({ editor, showRules, setShowRules }: { editor: Editor | null; showRules: boolean; setShowRules: (v: boolean) => void }) {
  if (!editor) return null;
  const issues = collectIssues(editor.state.doc);
  const warnings = chapterWarnings(editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n"));
  const cats = Object.keys(CATEGORY_LABELS) as RuleCategory[];

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={showRules} onChange={(e) => setShowRules(e.target.checked)} />
        Podčiarkovať v texte
      </label>
      <p className="text-xs text-muted">
        Nič sa neprepisuje — len upozornenie. Ak pojem v texte kritizuješ alebo vysvetľuješ, je to v poriadku.
      </p>
      <div className="flex gap-3 text-xs">
        {cats.map((c) => (
          <span key={c} className={`rule rule-${c}`}>
            {CATEGORY_LABELS[c]}: {issues.filter((i) => i.category === c).length}
          </span>
        ))}
      </div>
      {warnings.map((w) => (
        <p key={w} className="rounded-md border border-danger/40 bg-danger/10 p-2 text-sm">
          {w}
        </p>
      ))}
      {issues.length === 0 && warnings.length === 0 && <p className="text-sm text-muted">Bez nálezov.</p>}
      <ul className="flex flex-col gap-2">
        {issues.map((i) => (
          <li key={`${i.pos}-${i.ruleId}`}>
            <button
              className="w-full rounded-md border border-line p-2 text-left text-sm hover:border-gold"
              onClick={() => editor.chain().focus().setTextSelection({ from: i.pos, to: i.end }).scrollIntoView().run()}
            >
              <span className={`rule rule-${i.category} font-medium`}>{i.match}</span>
              <span className="mt-1 block text-xs text-muted">{i.message}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
