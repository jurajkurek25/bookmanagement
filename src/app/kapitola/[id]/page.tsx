"use client";

import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHAPTER_STATUSES, levelOf, pages, type ChapterRow, type Exercise } from "@/lib/book";
import { addFoundSource, check, fetchSources, useQuery } from "@/lib/data";
import { docText, wordCount, type ClaimAttrs, type JNode } from "@/lib/doc";
import { supabase } from "@/lib/supabase";
import { AssistantPanel } from "@/components/chapter/AssistantPanel";
import { CheckPanel } from "@/components/chapter/CheckPanel";
import { ClaimPanel } from "@/components/chapter/ClaimPanel";
import { SourcesPanel } from "@/components/chapter/SourcesPanel";
import { WorksheetPanel } from "@/components/chapter/WorksheetPanel";
import { ChapterEditor } from "@/components/editor/ChapterEditor";
import { findClaimRange, updateClaimTr } from "@/components/editor/extensions";
import { ErrorText, Input, Select, Textarea } from "@/components/ui";

type Tab = "tvrdenie" | "zdroje" | "asistent" | "kroky" | "poznamky" | "kontrola";
const TABS: { id: Tab; label: string }[] = [
  { id: "tvrdenie", label: "Tvrdenie" },
  { id: "zdroje", label: "Zdroje" },
  { id: "asistent", label: "Asistent" },
  { id: "kroky", label: "Pracovný list" },
  { id: "poznamky", label: "Poznámky" },
  { id: "kontrola", label: "Kontrola" },
];

type Save = "ulozene" | "neulozene" | "ukladam" | "chyba";

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, setData } = useQuery(async () => {
    const chapter = check(await supabase().from("chapters").select("*").eq("id", id).single()) as ChapterRow;
    const links = check(await supabase().from("chapter_sources").select("source_id").eq("chapter_id", id)) as { source_id: string }[];
    return { chapter, sources: await fetchSources(), linkedIds: new Set(links.map((l) => l.source_id)) };
  }, [id]);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [tab, setTab] = useState<Tab>("zdroje");
  const [claim, setClaim] = useState<ClaimAttrs | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [save, setSave] = useState<Save>("ulozene");
  const [err, setErr] = useState("");
  const [words, setWords] = useState<number | null>(null);

  const pending = useRef<Record<string, unknown>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return;
    setSave("ukladam");
    const res = await supabase().from("chapters").update(patch).eq("id", id);
    if (res.error) {
      pending.current = { ...patch, ...pending.current };
      setSave("chyba");
      setErr(res.error.message);
    } else setSave(Object.keys(pending.current).length ? "neulozene" : "ulozene");
  }, [id]);

  const queue = useCallback(
    (patch: Record<string, unknown>, delay = 1200) => {
      pending.current = { ...pending.current, ...patch };
      setSave("neulozene");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush],
  );

  // Pri odchode zo stránky neuložené zmeny dopíšeme.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      flush();
    };
  }, [flush]);

  const sources = useMemo(() => data?.sources ?? [], [data]);
  const sourcesById = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const linkedIds = data?.linkedIds ?? new Set<string>();
  const linked = sources.filter((s) => linkedIds.has(s.id));

  const onChange = useCallback(
    (doc: JNode) => {
      const wc = wordCount(docText(doc));
      setWords(wc);
      queue({ content: doc, word_count: wc });
    },
    [queue],
  );

  const onActiveClaim = useCallback((c: ClaimAttrs | null) => {
    setClaim(c);
    if (c) setTab("tvrdenie");
  }, []);

  if (error) return <div className="p-6"><ErrorText error={error} /></div>;
  if (!data) return <p className="p-6 text-muted">Načítavam…</p>;
  const ch = data.chapter;
  const lvl = levelOf(ch.level);

  const setChapter = (patch: Partial<ChapterRow>) => setData({ ...data, chapter: { ...ch, ...patch } });
  const setLinked = (next: Set<string>) => setData({ ...data, linkedIds: next });

  async function link(sourceId: string) {
    if (linkedIds.has(sourceId)) return;
    const res = await supabase().from("chapter_sources").insert({ chapter_id: id, source_id: sourceId });
    if (res.error) return setErr(res.error.message);
    setLinked(new Set([...linkedIds, sourceId]));
  }

  async function unlink(sourceId: string) {
    const res = await supabase().from("chapter_sources").delete().eq("chapter_id", id).eq("source_id", sourceId);
    if (res.error) return setErr(res.error.message);
    const next = new Set(linkedIds);
    next.delete(sourceId);
    setLinked(next);
  }

  function updateClaim(attrs: ClaimAttrs | null) {
    if (!editor || !claim) return;
    editor.view.dispatch(updateClaimTr(editor.state.tr, claim.id, attrs));
    setClaim(attrs);
    // Zdroj použitý v tvrdení patrí ku kapitole (kvôli matici vyváženosti).
    attrs?.sources.filter((s) => !linkedIds.has(s)).forEach(link);
  }

  const claimText = (() => {
    if (!editor || !claim) return "";
    const r = findClaimRange(editor.state.doc, claim.id);
    return r ? editor.state.doc.textBetween(r.from, r.to, " ") : "";
  })();

  const wc = words ?? ch.word_count;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-muted">
          <Link href={`/uroven/${ch.level}`} className="hover:text-gold">
            {lvl.level}. {lvl.name}
          </Link>
          <span>·</span>
          <span>
            {wc.toLocaleString("sk")} slov · {pages(wc).toFixed(1)} s.
          </span>
          <span>·</span>
          <span className={save === "chyba" ? "text-danger" : ""}>
            {{ ulozene: "Uložené", neulozene: "Neuložené…", ukladam: "Ukladám…", chyba: "Chyba ukladania" }[save]}
          </span>
          <Select
            className="ml-auto !w-auto"
            value={ch.status}
            onChange={(e) => {
              setChapter({ status: e.target.value as ChapterRow["status"] });
              queue({ status: e.target.value }, 0);
            }}
          >
            {CHAPTER_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <ErrorText error={err} />
        <Input
          className="mb-2 !border-0 !bg-transparent !px-0 font-serif !text-3xl font-bold"
          value={ch.title}
          onChange={(e) => {
            setChapter({ title: e.target.value });
            queue({ title: e.target.value });
          }}
        />
        <ChapterEditor
          content={ch.content as JNode}
          sourcesById={sourcesById}
          showRules={showRules}
          onChange={onChange}
          onActiveClaim={onActiveClaim}
          onReady={setEditor}
        />
      </div>

      <aside className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
        <div className="mb-3 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-2.5 py-1 text-sm ${tab === t.id ? "bg-gold-soft font-medium" : "text-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-line bg-surface p-4">
          {tab === "tvrdenie" &&
            (claim ? (
              <ClaimPanel claim={claim} text={claimText} sources={sources} linkedIds={linkedIds} sourcesById={sourcesById} onChange={updateClaim} />
            ) : (
              <p className="text-sm text-muted">
                Označ v texte vetu a klikni na <b>Označiť tvrdenie</b>. Potom ju prepoj so zdrojmi — alebo ju označ ako svoj názor. Klikni do existujúceho tvrdenia a uvidíš ho tu.
              </p>
            ))}
          {tab === "zdroje" && <SourcesPanel linked={linked} all={sources} onLink={link} onUnlink={unlink} />}
          {tab === "asistent" && (
            <AssistantPanel
              claimText={claimText}
              linked={linked}
              allSources={sources}
              onSaveNote={(text) => {
                const notes = ch.notes ? `${ch.notes}\n\n${text}` : text;
                setChapter({ notes });
                queue({ notes }, 0);
                setTab("poznamky");
              }}
              onAddSource={async (f) => {
                const sid = await addFoundSource(f);
                const res = await supabase().from("chapter_sources").insert({ chapter_id: id, source_id: sid });
                if (res.error) throw new Error(res.error.message);
                setData({ ...data, sources: await fetchSources(), linkedIds: new Set([...linkedIds, sid]) });
              }}
            />
          )}
          {tab === "kroky" && (
            <WorksheetPanel
              worksheet={ch.worksheet}
              sources={sources}
              onChange={(w: Exercise[]) => {
                setChapter({ worksheet: w });
                queue({ worksheet: w });
              }}
            />
          )}
          {tab === "poznamky" && (
            <Textarea
              rows={20}
              placeholder="Poznámky k výskumu tejto kapitoly — nápady, výstupy asistenta, čo treba overiť."
              value={ch.notes}
              onChange={(e) => {
                setChapter({ notes: e.target.value });
                queue({ notes: e.target.value });
              }}
            />
          )}
          {tab === "kontrola" && <CheckPanel editor={editor} showRules={showRules} setShowRules={setShowRules} />}
        </div>
      </aside>
    </div>
  );
}

