"use client";

import Link from "next/link";
import { CHAPTER_STATUSES, LEVELS, WORDS_PER_PAGE, pages, targetPagesFor } from "@/lib/book";
import { fetchBudgets, fetchChapters, useQuery } from "@/lib/data";
import { ErrorText, Page } from "@/components/ui";

export default function PyramidPage() {
  const { data, error } = useQuery(async () => ({ chapters: await fetchChapters(), budgets: await fetchBudgets() }));
  const chapters = data?.chapters ?? [];
  const budgets = data?.budgets ?? [];

  const totalWords = chapters.reduce((s, c) => s + c.word_count, 0);
  const totalTarget = LEVELS.reduce((s, l) => s + targetPagesFor(l.level, budgets), 0);
  const done = chapters.filter((c) => c.status === "hotovo").length;

  return (
    <Page
      title="(Ne)potrebný muž"
      subtitle={`${Math.round(pages(totalWords))} z ${totalTarget} strán · ${totalWords.toLocaleString("sk")} slov · ${chapters.length} kapitol, hotových ${done} · 1 strana ≈ ${WORDS_PER_PAGE} slov`}
    >
      <ErrorText error={error} />
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-1.5">
        {LEVELS.map((l, i) => {
          const own = chapters.filter((c) => c.level === l.level);
          const words = own.reduce((s, c) => s + c.word_count, 0);
          const target = targetPagesFor(l.level, budgets);
          const pct = target ? Math.min(100, (pages(words) / target) * 100) : 0;
          const width = 34 + (i / (LEVELS.length - 1)) * 66;
          return (
            <Link
              key={l.level}
              href={`/uroven/${l.level}`}
              style={{ width: `${width}%` }}
              className="group relative min-w-[16rem] overflow-hidden rounded-md border border-line bg-surface px-4 py-3 transition hover:border-gold"
            >
              <div className="absolute inset-y-0 left-0 bg-gold-soft transition-all" style={{ width: `${pct}%` }} aria-hidden />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-serif font-bold">
                    <span className="text-gold">{l.level}.</span> {l.name}
                  </div>
                  <div className="truncate text-xs text-muted">{l.subtitle}</div>
                </div>
                <div className="shrink-0 text-right text-xs text-muted">
                  <div className="font-medium text-ink">
                    {Math.round(pages(words))} / {target} s.
                  </div>
                  <div>{own.length} kap.</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-4 text-xs text-muted">
        {CHAPTER_STATUSES.map((s) => (
          <span key={s.id}>
            {s.label}: <b className="text-ink">{chapters.filter((c) => c.status === s.id).length}</b>
          </span>
        ))}
      </div>
    </Page>
  );
}
