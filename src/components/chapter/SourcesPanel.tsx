"use client";

import Link from "next/link";
import type { Source } from "@/lib/book";
import { SourceLine } from "../SourceLine";
import { Select } from "../ui";

export function SourcesPanel({ linked, all, onLink, onUnlink }: { linked: Source[]; all: Source[]; onLink: (id: string) => void; onUnlink: (id: string) => void }) {
  const ids = new Set(linked.map((s) => s.id));
  const rest = all.filter((s) => !ids.has(s.id));
  return (
    <div className="flex flex-col gap-3">
      <Select value="" onChange={(e) => e.target.value && onLink(e.target.value)}>
        <option value="">+ Pridať zdroj z knižnice…</option>
        {rest.map((s) => (
          <option key={s.id} value={s.id}>
            {s.authors.split(",")[0] || "—"} {s.year ? `(${s.year})` : ""} · {s.title.slice(0, 70)}
          </option>
        ))}
      </Select>
      <Link href="/zdroje" className="text-xs text-gold underline">
        Otvoriť knižnicu zdrojov (nový zdroj, import cez DOI)
      </Link>
      {linked.length === 0 && <p className="text-sm text-muted">Kapitola zatiaľ nemá zdroje.</p>}
      <ul className="flex flex-col gap-3">
        {linked.map((s) => (
          <li key={s.id} className="flex items-start gap-2 border-b border-line pb-3">
            <SourceLine s={s} />
            <button className="ml-auto shrink-0 text-xs text-muted hover:text-danger" onClick={() => onUnlink(s.id)} title="Odobrať z kapitoly">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
