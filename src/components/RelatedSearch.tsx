"use client";

import { useState } from "react";
import type { Source } from "@/lib/book";
import type { Found } from "@/lib/server/lookup";
import { api } from "@/lib/supabase";
import { Button, ErrorText, Input } from "./ui";

// Hľadanie súvisiacich štúdií: asistent navrhne dopyt, výsledky sú skutočné záznamy z PubMed.
export function RelatedSearch({ existing, onAdd }: { existing: Source[]; onAdd: (f: Found) => Promise<void> }) {
  const [topic, setTopic] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Found[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const have = new Set(existing.flatMap((s) => [s.pmid, s.doi.toLowerCase()]).filter(Boolean));

  async function run(direct: boolean) {
    setBusy(true);
    setError("");
    try {
      if (direct) {
        const r = await api<{ results: Found[] }>(`/api/lookup?q=${encodeURIComponent(query)}`);
        setResults(r.results);
      } else {
        const r = await api<{ query: string; results: Found[] }>("/api/assistant", { method: "POST", body: JSON.stringify({ task: "query", topic }) });
        setQuery(r.query);
        setResults(r.results);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input placeholder="Téma po slovensky, napr. osamelosť mužov po tridsiatke" value={topic} onChange={(e) => setTopic(e.target.value)} />
      <Button disabled={busy || !topic.trim()} onClick={() => run(false)}>
        {busy ? "Hľadám…" : "Nájsť súvisiace štúdie"}
      </Button>
      {query && (
        <div className="flex gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} title="Dopyt pre PubMed — môžeš ho upraviť" />
          <Button variant="ghost" disabled={busy} onClick={() => run(true)}>
            Znova
          </Button>
        </div>
      )}
      <ErrorText error={error} />
      {query && results.length === 0 && !busy && <p className="text-sm text-muted">Nič sa nenašlo. Uprav dopyt.</p>}
      <ul className="flex flex-col gap-2">
        {results.map((r) => {
          const added = have.has(r.pmid) || (r.doi && have.has(r.doi.toLowerCase()));
          return (
            <li key={r.pmid} className="rounded-md border border-line p-2 text-sm">
              <a href={r.url} target="_blank" rel="noreferrer" className="font-medium hover:text-gold">
                {r.title}
              </a>
              <div className="text-xs text-muted">
                {r.authors.split(",").slice(0, 3).join(",")}
                {r.authors.split(",").length > 3 ? " a kol." : ""} · {r.journal} · {r.year}
              </div>
              <Button
                variant="ghost"
                className="mt-1"
                disabled={!!added}
                onClick={async () => {
                  try {
                    await onAdd(r);
                    setResults((rs) => [...rs]);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                {added ? "Už v knižnici" : "Pridať do knižnice"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
