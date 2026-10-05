"use client";

import { useState } from "react";
import { DISCIPLINES, EVIDENCE, type Source } from "@/lib/book";
import { addFoundSource, check, fetchSources, useQuery } from "@/lib/data";
import type { Found } from "@/lib/server/lookup";
import { api, supabase } from "@/lib/supabase";
import { RelatedSearch } from "@/components/RelatedSearch";
import { EMPTY_DRAFT, SourceForm, type Draft } from "@/components/SourceForm";
import { SourceLine } from "@/components/SourceLine";
import { Button, ErrorText, Input, Page, Select } from "@/components/ui";

export default function SourcesPage() {
  const { data, error, reload } = useQuery(async () => {
    const usage = check(await supabase().from("chapter_sources").select("source_id, chapters(title)")) as unknown as {
      source_id: string;
      chapters: { title: string } | null;
    }[];
    return { sources: await fetchSources(), usage };
  });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [q, setQ] = useState("");
  const [disc, setDisc] = useState("");
  const [ev, setEv] = useState("");
  const [importId, setImportId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const sources = data?.sources ?? [];
  const filtered = sources.filter(
    (s) =>
      (!disc || s.discipline === disc) &&
      (!ev || s.evidence === ev) &&
      (!q || `${s.title} ${s.authors} ${s.plain} ${s.notes}`.toLowerCase().includes(q.toLowerCase())),
  );
  const usedIn = (id: string) => (data?.usage ?? []).filter((u) => u.source_id === id).map((u) => u.chapters?.title ?? "");

  async function importSource(e: React.FormEvent) {
    e.preventDefault();
    const v = importId.trim();
    if (!v) return;
    const isPmid = /^\d+$/.test(v);
    const dup = sources.find((s) => (isPmid ? s.pmid === v : s.doi && v.toLowerCase().endsWith(s.doi.toLowerCase())));
    if (dup) return setDraft(dup);
    setBusy(true);
    setErr("");
    try {
      const r = await api<{ found: Found }>(`/api/lookup?${isPmid ? "pmid" : "doi"}=${encodeURIComponent(v)}`);
      setDraft({ ...EMPTY_DRAFT, ...r.found });
      setImportId("");
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  async function save(d: Draft) {
    const { id, ...row } = d;
    check(id ? await supabase().from("sources").update(row).eq("id", id) : await supabase().from("sources").insert(row));
    setDraft(null);
    reload();
  }

  return (
    <Page
      title="Knižnica zdrojov"
      subtitle={`${sources.length} zdrojov · bez „Ľudsky“: ${sources.filter((s) => !s.plain).length}`}
      actions={<Button onClick={() => setDraft({ ...EMPTY_DRAFT })}>Nový zdroj</Button>}
    >
      <ErrorText error={error || err} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_480px]">
        <div className="min-w-0">
          <form onSubmit={importSource} className="mb-4 flex gap-2">
            <Input placeholder="Import: DOI (10.…) alebo PubMed ID" value={importId} onChange={(e) => setImportId(e.target.value)} />
            <Button type="submit" disabled={busy}>
              {busy ? "Hľadám…" : "Načítať"}
            </Button>
          </form>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <Input placeholder="Hľadať…" value={q} onChange={(e) => setQ(e.target.value)} />
            <Select value={disc} onChange={(e) => setDisc(e.target.value)}>
              <option value="">Všetky disciplíny</option>
              {DISCIPLINES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </Select>
            <Select value={ev} onChange={(e) => setEv(e.target.value)}>
              <option value="">Všetky typy dôkazu</option>
              {EVIDENCE.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </Select>
          </div>
          {sources.length === 0 && data && <p className="text-muted">Knižnica je prázdna. Vlož DOI, PubMed ID, alebo pridaj knihu či historický prameň ručne.</p>}
          <ul className="flex flex-col gap-2">
            {filtered.map((s: Source) => (
              <li key={s.id}>
                <button
                  onClick={() => setDraft(s)}
                  className={`w-full rounded-md border bg-surface p-3 text-left hover:border-gold ${draft?.id === s.id ? "border-gold" : "border-line"}`}
                >
                  <SourceLine s={s} />
                  <div className="mt-1 text-xs text-muted">{usedIn(s.id).length ? `V kapitolách: ${usedIn(s.id).join(", ")}` : "Zatiaľ v žiadnej kapitole"}</div>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 rounded-xl border border-line bg-surface p-4">
            <h2 className="mb-3 font-serif text-lg font-bold">Nájsť súvisiace štúdie</h2>
            <RelatedSearch
              existing={sources}
              onAdd={async (f) => {
                await addFoundSource(f);
                reload();
              }}
            />
          </div>
        </div>
        <div>
          {draft ? (
            <div className="rounded-xl border border-line bg-surface p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
              <SourceForm
                key={draft.id ?? `new-${draft.doi}-${draft.pmid}`}
                draft={draft}
                usedIn={draft.id ? usedIn(draft.id) : []}
                onSave={save}
                onClose={() => setDraft(null)}
                onDelete={
                  draft.id
                    ? async () => {
                        check(await supabase().from("sources").delete().eq("id", draft.id!));
                        setDraft(null);
                        reload();
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <p className="text-sm text-muted">Vyber zdroj zo zoznamu alebo pridaj nový.</p>
          )}
        </div>
      </div>
    </Page>
  );
}
