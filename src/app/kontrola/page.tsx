"use client";

import Link from "next/link";
import { useState } from "react";
import { BOOK_ORDER } from "@/lib/book";
import { fetchChapters, useQuery } from "@/lib/data";
import { docText, type JNode } from "@/lib/doc";
import { analyze, CATEGORY_LABELS, chapterWarnings, type RuleCategory } from "@/lib/rules";
import { ErrorText, Page } from "@/components/ui";

const CATS = Object.keys(CATEGORY_LABELS) as RuleCategory[];

export default function CheckPage() {
  const { data, error } = useQuery(() => fetchChapters("id, level, title, position, content"));
  const [cat, setCat] = useState<RuleCategory | "">("");

  const rows = BOOK_ORDER.flatMap((l) => (data ?? []).filter((c) => c.level === l.level)).map((c) => {
    const text = docText(c.content as JNode);
    return { c, text, issues: analyze(text, cat ? [cat] : undefined), warnings: chapterWarnings(text) };
  });
  const total = (k: RuleCategory) => rows.reduce((s, r) => s + analyze(r.text, [k]).length, 0);

  return (
    <Page title="Kontrola tónu a citlivých tém" subtitle="Žargón, jazyk manosféry a písanie o samovražde a závislosti podľa odporúčaní WHO. Nič sa neprepisuje — rozhoduješ ty.">
      <ErrorText error={error} />
      <div className="mb-4 flex flex-wrap gap-2">
        {CATS.map((k) => (
          <button
            key={k}
            onClick={() => setCat(cat === k ? "" : k)}
            className={`rounded-md border px-3 py-1.5 text-sm ${cat === k ? "border-gold bg-gold-soft" : "border-line bg-surface"}`}
          >
            <span className={`rule rule-${k}`}>{CATEGORY_LABELS[k]}</span>: <b>{data ? total(k) : "…"}</b>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rows
          .filter((r) => r.issues.length || r.warnings.length)
          .map(({ c, text, issues, warnings }) => (
            <section key={c.id} className="rounded-xl border border-line bg-surface p-4">
              <Link href={`/kapitola/${c.id}`} className="font-serif text-lg font-bold hover:text-gold">
                {c.level}. · {c.title}
              </Link>
              {warnings.map((w) => (
                <p key={w} className="mt-2 rounded-md border border-danger/40 bg-danger/10 p-2 text-sm">
                  {w}
                </p>
              ))}
              <ul className="mt-2 flex flex-col gap-1.5">
                {issues.map((i) => (
                  <li key={`${i.from}-${i.ruleId}`} className="text-sm">
                    <span className="text-muted">…{text.slice(Math.max(0, i.from - 40), i.from).replace(/\n/g, " ")}</span>
                    <span className={`rule rule-${i.category} font-medium`}>{i.match}</span>
                    <span className="text-muted">{text.slice(i.to, i.to + 40).replace(/\n/g, " ")}…</span>
                    <span className="block text-xs text-muted">{i.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        {data && rows.every((r) => !r.issues.length && !r.warnings.length) && <p className="text-muted">Bez nálezov.</p>}
      </div>
    </Page>
  );
}
