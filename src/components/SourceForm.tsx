"use client";

import { useState } from "react";
import { DISCIPLINES, EVIDENCE, REPLICATION, SOURCE_KINDS, type Source } from "@/lib/book";
import { api } from "@/lib/supabase";
import { AssistantResult } from "./AssistantResult";
import { Button, ErrorText, Input, Label, Select, Textarea } from "./ui";

export type Draft = Omit<Source, "id"> & { id?: string };

export const EMPTY_DRAFT: Draft = {
  kind: "studia", title: "", authors: "", year: null, journal: "", doi: "", pmid: "", url: "", edition_note: "",
  discipline: "psychologia", evidence: "nezaradene", replication: "nezname", abstract: "", summary: "", plain: "", limitations: "", notes: "",
};

type Props = { draft: Draft; usedIn: string[]; onSave: (d: Draft) => Promise<void>; onDelete?: () => Promise<void>; onClose: () => void };

export function SourceForm({ draft: initial, usedIn, onSave, onDelete, onClose }: Props) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [ai, setAi] = useState<{ task: "summarize" | "translate"; text: string } | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));

  async function assistant(task: "summarize" | "translate") {
    const text = d.abstract.trim();
    if (!text) return setError("Najprv vlož abstrakt (alebo podstatnú časť štúdie).");
    setBusy(task);
    setError("");
    try {
      const r = await api<{ result: string }>("/api/assistant", { method: "POST", body: JSON.stringify({ task, title: d.title, text }) });
      setAi({ task, text: r.result });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy("");
  }

  async function verify() {
    const q = d.doi ? `doi=${encodeURIComponent(d.doi)}` : d.pmid ? `pmid=${encodeURIComponent(d.pmid)}` : "";
    if (!q) return setError("Zdroj nemá DOI ani PMID — over ho ručne.");
    setBusy("verify");
    setError("");
    try {
      const r = await api<{ found: { title: string; year: number | null } }>(`/api/lookup?${q}`);
      alert(`Zdroj existuje:\n${r.found.title} (${r.found.year ?? "rok neuvedený"})`);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy("");
  }

  async function save() {
    if (!d.title.trim()) return setError("Zdroj potrebuje názov.");
    setBusy("save");
    setError("");
    try {
      await onSave(d);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-bold">{d.id ? "Upraviť zdroj" : "Nový zdroj"}</h2>
        <button onClick={onClose} className="text-sm text-muted hover:text-ink">
          Zavrieť
        </button>
      </div>
      <ErrorText error={error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Label title="Typ">
          <Select value={d.kind} onChange={(e) => set("kind", e.target.value as Draft["kind"])}>
            {SOURCE_KINDS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Select>
        </Label>
        <Label title="Disciplína">
          <Select value={d.discipline} onChange={(e) => set("discipline", e.target.value as Draft["discipline"])}>
            {DISCIPLINES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Select>
        </Label>
      </div>
      <Label title="Názov">
        <Input value={d.title} onChange={(e) => set("title", e.target.value)} />
      </Label>
      <div className="grid gap-3 sm:grid-cols-[1fr_100px]">
        <Label title="Autori" hint="Priezvisko, iniciály, oddelené čiarkou">
          <Input value={d.authors} onChange={(e) => set("authors", e.target.value)} />
        </Label>
        <Label title="Rok">
          <Input type="number" value={d.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)} />
        </Label>
      </div>
      <Label title="Časopis / vydavateľ">
        <Input value={d.journal} onChange={(e) => set("journal", e.target.value)} />
      </Label>
      {(d.kind === "historicky" || d.kind === "kniha") && (
        <Label title="Vydanie, preklad, strana" hint="Napr. „preklad J. Novák, Kalligram 2018, s. 45“">
          <Input value={d.edition_note} onChange={(e) => set("edition_note", e.target.value)} />
        </Label>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <Label title="DOI"><Input value={d.doi} onChange={(e) => set("doi", e.target.value)} /></Label>
        <Label title="PMID"><Input value={d.pmid} onChange={(e) => set("pmid", e.target.value)} /></Label>
        <Label title="URL"><Input value={d.url} onChange={(e) => set("url", e.target.value)} /></Label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Label title="Typ dôkazu">
          <Select value={d.evidence} onChange={(e) => set("evidence", e.target.value as Draft["evidence"])}>
            {EVIDENCE.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Select>
        </Label>
        <Label title="Replikácia">
          <Select value={d.replication} onChange={(e) => set("replication", e.target.value as Draft["replication"])}>
            {REPLICATION.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Select>
        </Label>
      </div>

      <Label title="Ľudsky" hint="Jedna veta tvojimi slovami — ako by si to povedal kamarátovi pri pive. Toto píšeš ty, asistent to nevypĺňa.">
        <Textarea rows={2} value={d.plain} onChange={(e) => set("plain", e.target.value)} />
      </Label>
      <Label title="Abstrakt / text štúdie">
        <Textarea rows={5} value={d.abstract} onChange={(e) => set("abstract", e.target.value)} />
      </Label>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" disabled={!!busy} onClick={() => assistant("summarize")}>
          {busy === "summarize" ? "Zhŕňam…" : "Zhrnúť po slovensky"}
        </Button>
        <Button variant="ghost" disabled={!!busy} onClick={() => assistant("translate")}>
          {busy === "translate" ? "Prekladám…" : "Preložiť abstrakt"}
        </Button>
        <Button variant="ghost" disabled={!!busy} onClick={verify}>
          {busy === "verify" ? "Overujem…" : "Overiť, že existuje"}
        </Button>
      </div>
      {ai && (
        <AssistantResult
          text={ai.text}
          actions={
            <>
              {ai.task === "summarize" && (
                <Button variant="ghost" onClick={() => { set("summary", ai.text); setAi(null); }}>
                  Použiť ako zhrnutie
                </Button>
              )}
              <Button variant="ghost" onClick={() => { set("notes", d.notes ? `${d.notes}\n\n${ai.text}` : ai.text); setAi(null); }}>
                Pridať do poznámok
              </Button>
            </>
          }
        />
      )}
      <Label title="Zhrnutie (odborné)">
        <Textarea rows={5} value={d.summary} onChange={(e) => set("summary", e.target.value)} />
      </Label>
      <Label title="Obmedzenia" hint="Vzorka, krajina, rok, čo z toho nevyplýva">
        <Textarea rows={2} value={d.limitations} onChange={(e) => set("limitations", e.target.value)} />
      </Label>
      <Label title="Poznámky">
        <Textarea rows={4} value={d.notes} onChange={(e) => set("notes", e.target.value)} />
      </Label>
      {usedIn.length > 0 && <p className="text-xs text-muted">Použité v kapitolách: {usedIn.join(", ")}</p>}
      <div className="flex gap-2">
        <Button disabled={!!busy} onClick={save}>
          {busy === "save" ? "Ukladám…" : "Uložiť"}
        </Button>
        {onDelete && (
          <Button
            variant="danger"
            disabled={!!busy}
            onClick={async () => {
              if (confirm("Zmazať zdroj? Tvrdenia, ktoré sa naň odvolávajú, ostanú bez neho.")) await onDelete().catch((e) => setError(e.message));
            }}
          >
            Zmazať
          </Button>
        )}
      </div>
    </div>
  );
}
