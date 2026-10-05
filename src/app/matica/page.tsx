"use client";

import Link from "next/link";
import { DISCIPLINES, LEVELS, type Discipline } from "@/lib/book";
import { fetchChapterSourceLinks, fetchChapters, fetchSources, useQuery } from "@/lib/data";
import { ErrorText, Page } from "@/components/ui";

// Sekvenčná škála jedného odtieňa (zlatá), 0 = neutrálna sivá s prerušovaným okrajom.
function cellStyle(n: number, max: number): React.CSSProperties {
  if (n === 0) return {};
  const t = Math.min(1, n / Math.max(max, 1));
  return { background: `color-mix(in oklab, var(--gold) ${Math.round(18 + t * 62)}%, var(--surface))` };
}

export default function MatrixPage() {
  const { data, error } = useQuery(async () => ({
    chapters: await fetchChapters("id, level"),
    sources: await fetchSources(),
    links: await fetchChapterSourceLinks(),
  }));

  const levelOfChapter = new Map((data?.chapters ?? []).map((c) => [c.id, c.level]));
  const discOf = new Map((data?.sources ?? []).map((s) => [s.id, s.discipline]));
  // Počet rôznych zdrojov na úroveň × disciplínu.
  const cells = new Map<string, Set<string>>();
  for (const l of data?.links ?? []) {
    const level = levelOfChapter.get(l.chapter_id);
    const disc = discOf.get(l.source_id);
    if (!level || !disc) continue;
    const k = `${level}:${disc}`;
    if (!cells.has(k)) cells.set(k, new Set());
    cells.get(k)!.add(l.source_id);
  }
  const n = (level: number, d: Discipline) => cells.get(`${level}:${d}`)?.size ?? 0;
  const max = Math.max(1, ...[...cells.values()].map((s) => s.size));
  const gaps = LEVELS.flatMap((l) => DISCIPLINES.filter((d) => n(l.level, d.id) === 0).map((d) => ({ l, d })));

  return (
    <Page title="Matica vyváženosti" subtitle="Koľko rôznych zdrojov z každej disciplíny sa opiera o kapitoly danej úrovne. Prázdne políčko = chýbajúci uhol pohľadu.">
      <ErrorText error={error} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left font-medium text-muted">Úroveň</th>
              {DISCIPLINES.map((d) => (
                <th key={d.id} className="p-2 text-center font-medium text-muted">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEVELS.map((l) => (
              <tr key={l.level}>
                <th className="rounded-md bg-surface p-2 text-left font-normal">
                  <Link href={`/uroven/${l.level}`} className="hover:text-gold">
                    <span className="text-gold">{l.level}.</span> {l.name}
                  </Link>
                </th>
                {DISCIPLINES.map((d) => {
                  const v = n(l.level, d.id);
                  return (
                    <td
                      key={d.id}
                      title={`${l.name} × ${d.label}: ${v} ${v === 1 ? "zdroj" : v >= 2 && v <= 4 ? "zdroje" : "zdrojov"}`}
                      style={cellStyle(v, max)}
                      className={`h-11 rounded-md text-center tabular-nums ${v === 0 ? "border border-dashed border-line text-muted" : "font-medium text-ink"}`}
                    >
                      {v === 0 ? "–" : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && (
        <p className="mt-4 text-sm text-muted">
          Chýbajúce kombinácie: <b className="text-ink">{gaps.length}</b> z {LEVELS.length * DISCIPLINES.length}. Nie každé políčko musí byť plné — ale každé prázdne by malo byť vedomé rozhodnutie.
        </p>
      )}
    </Page>
  );
}
