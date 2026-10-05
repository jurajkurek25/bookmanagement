"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CHAPTER_STATUSES, label, levelOf, pages, targetPagesFor, type ChapterRow } from "@/lib/book";
import { check, fetchBudgets, saveBudget, useQuery } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Button, ErrorText, Input, Page } from "@/components/ui";

export default function LevelPage() {
  const level = Number(useParams<{ level: string }>().level);
  const router = useRouter();
  const lvl = levelOf(level);
  const [title, setTitle] = useState("");
  const [err, setErr] = useState("");

  const { data, error, reload } = useQuery(async () => {
    const chapters = check(
      await supabase().from("chapters").select("id, level, title, position, status, word_count, updated_at").eq("level", level).order("position"),
    ) as ChapterRow[];
    return { chapters, budgets: await fetchBudgets() };
  }, [level]);
  const chapters = data?.chapters ?? [];
  const target = targetPagesFor(level, data?.budgets ?? []);
  const words = chapters.reduce((s, c) => s + c.word_count, 0);

  const run = (fn: () => Promise<unknown>) =>
    fn()
      .then(reload)
      .catch((e: Error) => setErr(e.message));

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const position = chapters.length ? Math.max(...chapters.map((c) => c.position)) + 1 : 0;
    const res = await supabase().from("chapters").insert({ level, title: title.trim(), position }).select("id").single();
    if (res.error) return setErr(res.error.message);
    router.push(`/kapitola/${res.data.id}`);
  }

  async function move(i: number, dir: -1 | 1) {
    const a = chapters[i];
    const b = chapters[i + dir];
    if (!b) return;
    await run(async () => {
      check(await supabase().from("chapters").update({ position: b.position }).eq("id", a.id));
      check(await supabase().from("chapters").update({ position: a.position === b.position ? a.position + dir : a.position }).eq("id", b.id));
    });
  }

  async function remove(c: ChapterRow) {
    if (!confirm(`Naozaj zmazať kapitolu „${c.title}“? Text sa stratí.`)) return;
    await run(async () => check(await supabase().from("chapters").delete().eq("id", c.id)));
  }

  return (
    <Page
      title={`${lvl.level}. ${lvl.name}`}
      subtitle={`${lvl.subtitle} · ${Math.round(pages(words))} z ${target} strán`}
      actions={
        <label className="flex items-center gap-2 text-sm text-muted">
          Cieľ strán
          <Input
            type="number"
            min={0}
            className="w-24"
            defaultValue={target}
            key={target}
            onBlur={(e) => {
              const v = Number(e.target.value);
              if (v >= 0 && v !== target) run(() => saveBudget(level, v));
            }}
          />
        </label>
      }
    >
      <ErrorText error={error || err} />
      <form onSubmit={add} className="mb-6 flex gap-2">
        <Input placeholder="Názov novej kapitoly" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button type="submit">Pridať kapitolu</Button>
      </form>
      {chapters.length === 0 && <p className="text-muted">Zatiaľ žiadne kapitoly. Začni názvom — obsah príde neskôr.</p>}
      <ol className="flex flex-col gap-2">
        {chapters.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
            <span className="w-6 text-sm text-muted">{i + 1}.</span>
            <Link href={`/kapitola/${c.id}`} className="min-w-0 flex-1 truncate font-serif text-lg hover:text-gold">
              {c.title}
            </Link>
            <span className="rounded bg-gold-soft px-2 py-0.5 text-xs">{label(CHAPTER_STATUSES, c.status)}</span>
            <span className="w-24 text-right text-xs text-muted">
              {c.word_count.toLocaleString("sk")} slov · {pages(c.word_count).toFixed(1)} s.
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Posunúť vyššie">
                ↑
              </Button>
              <Button variant="ghost" onClick={() => move(i, 1)} disabled={i === chapters.length - 1} aria-label="Posunúť nižšie">
                ↓
              </Button>
              <Button variant="danger" onClick={() => remove(c)}>
                Zmazať
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </Page>
  );
}
