"use client";

import Link from "next/link";
import { useState } from "react";
import { BOOK_ORDER, CLAIM_COLORS, claimColor, type ChapterRow, type ClaimColor } from "@/lib/book";
import { fetchChapters, fetchSources, useQuery } from "@/lib/data";
import { extractClaims, type JNode } from "@/lib/doc";
import { ErrorText, Page } from "@/components/ui";

const ORDER: ClaimColor[] = ["red", "yellow", "green", "opinion"];

export default function ClaimsPage() {
  const { data, error } = useQuery(async () => ({
    chapters: await fetchChapters("id, level, title, position, content"),
    sources: await fetchSources(),
  }));
  const [filter, setFilter] = useState<ClaimColor | "">("red");

  const byId = new Map((data?.sources ?? []).map((s) => [s.id, s]));
  const rows = BOOK_ORDER.flatMap((l) =>
    (data?.chapters ?? [])
      .filter((c: ChapterRow) => c.level === l.level)
      .flatMap((c) => extractClaims(c.content as JNode).map((cl) => ({ chapter: c, claim: cl, color: claimColor(cl, byId) }))),
  );
  const count = (c: ClaimColor) => rows.filter((r) => r.color === c).length;
  const shown = rows.filter((r) => !filter || r.color === filter);

  return (
    <Page title="Register tvrdení" subtitle="Netvrdím, čo neviem. Pred odovzdaním rukopisu by mal byť zoznam 🔴 prázdny.">
      <ErrorText error={error} />
      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(filter === c ? "" : c)}
            className={`rounded-md border px-3 py-1.5 text-sm ${filter === c ? "border-gold bg-gold-soft" : "border-line bg-surface"}`}
          >
            {CLAIM_COLORS[c].dot} {CLAIM_COLORS[c].label}: <b>{count(c)}</b>
          </button>
        ))}
      </div>
      {data && shown.length === 0 && <p className="text-muted">{rows.length ? "V tomto filtri nič nie je." : "Zatiaľ žiadne označené tvrdenia."}</p>}
      <ul className="flex flex-col gap-2">
        {shown.map(({ chapter, claim, color }) => (
          <li key={claim.id} className="rounded-md border border-line bg-surface p-3">
            <p className="font-serif">
              {CLAIM_COLORS[color].dot} „{claim.text}“
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
              <Link href={`/kapitola/${chapter.id}`} className="text-gold hover:underline">
                {chapter.level}. · {chapter.title}
              </Link>
              {claim.sources
                .map((id) => byId.get(id))
                .filter((s) => s !== undefined)
                .map((s) => (
                  <span key={s.id}>
                    {s.authors.split(",")[0] || s.title.slice(0, 40)} {s.year ? `(${s.year})` : ""}
                  </span>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
