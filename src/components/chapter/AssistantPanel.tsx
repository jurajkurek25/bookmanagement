"use client";

import { useState } from "react";
import type { Source } from "@/lib/book";
import type { Found } from "@/lib/server/lookup";
import { api } from "@/lib/supabase";
import { AssistantResult } from "../AssistantResult";
import { RelatedSearch } from "../RelatedSearch";
import { Button, ErrorText, Label, Select, Textarea } from "../ui";

type Props = {
  claimText: string;
  linked: Source[];
  allSources: Source[];
  onSaveNote: (text: string) => void;
  onAddSource: (f: Found) => Promise<void>;
};

export function AssistantPanel({ claimText, linked, allSources, onSaveNote, onAddSource }: Props) {
  const [claim, setClaim] = useState(claimText);
  const [sourceId, setSourceId] = useState("");
  const [result, setResult] = useState({ title: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Keď autor klikne do iného tvrdenia v texte, predvyplníme ho.
  const [prevClaimText, setPrevClaimText] = useState(claimText);
  if (claimText !== prevClaimText) {
    setPrevClaimText(claimText);
    if (claimText) setClaim(claimText);
  }

  async function run(task: "counter" | "check") {
    const s = linked.find((x) => x.id === sourceId);
    const sourceText = s ? [s.abstract, s.summary, s.plain && `Autor zhrnul: ${s.plain}`].filter(Boolean).join("\n\n") : "";
    if (task === "check" && !sourceText) return setError("Zdroj nemá abstrakt ani zhrnutie — doplň ho v knižnici.");
    setBusy(true);
    setError("");
    try {
      const r = await api<{ result: string }>("/api/assistant", {
        method: "POST",
        body: JSON.stringify({ task, claim, title: s?.title, text: sourceText || undefined }),
      });
      setResult({ title: task === "counter" ? `Protiargumenty k: „${claim}“` : `Overenie „${claim}“ voči ${s?.title}`, text: r.result });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">Asistent nepíše knihu. Pomáha s výskumom; výstup si môžeš uložiť do poznámok kapitoly.</p>
      <Label title="Tvrdenie" hint="Klikni do označeného tvrdenia v texte, alebo ho napíš sem.">
        <Textarea rows={3} value={claim} onChange={(e) => setClaim(e.target.value)} />
      </Label>
      <Button variant="ghost" disabled={busy || !claim.trim()} onClick={() => run("counter")}>
        Čo by namietal kritik?
      </Button>
      <div className="flex gap-2">
        <Select value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
          <option value="">Vyber zdroj kapitoly…</option>
          {linked.map((s) => (
            <option key={s.id} value={s.id}>
              {s.authors.split(",")[0] || "—"} · {s.title.slice(0, 50)}
            </option>
          ))}
        </Select>
        <Button variant="ghost" disabled={busy || !claim.trim() || !sourceId} onClick={() => run("check")}>
          Overiť
        </Button>
      </div>
      {busy && <p className="text-sm text-muted">Asistent premýšľa…</p>}
      <ErrorText error={error} />
      <AssistantResult
        text={result.text}
        actions={
          <Button variant="ghost" onClick={() => onSaveNote(`${result.title}\n${result.text}`)}>
            Uložiť do poznámok kapitoly
          </Button>
        }
      />
      <hr className="border-line" />
      <div className="text-xs font-medium uppercase tracking-wide text-muted">Súvisiace štúdie (PubMed)</div>
      <RelatedSearch existing={allSources} onAdd={onAddSource} />
    </div>
  );
}
