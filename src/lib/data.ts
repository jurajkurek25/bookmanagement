"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChapterRow, Source } from "./book";
import { supabase } from "./supabase";

export type Budget = { level: number; target_pages: number };

// Jednoduché načítanie dát s možnosťou obnoviť. `deps` určujú, kedy načítať znova.
export function useQuery<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const key = JSON.stringify(deps);
  useEffect(() => {
    let alive = true;
    loadRef
      .current()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError("");
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [tick, key]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, reload, setData };
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export async function fetchChapters(columns = "id, level, title, position, status, word_count, worksheet, updated_at"): Promise<ChapterRow[]> {
  return check(await supabase().from("chapters").select(columns).order("level").order("position")) as unknown as ChapterRow[];
}

export async function fetchSources(): Promise<Source[]> {
  return check(await supabase().from("sources").select("*").order("authors"));
}

export async function fetchBudgets(): Promise<Budget[]> {
  return check(await supabase().from("level_budgets").select("level, target_pages"));
}

export async function saveBudget(level: number, target_pages: number) {
  check(await supabase().from("level_budgets").upsert({ level, target_pages }, { onConflict: "user_id,level" }));
}

export async function fetchChapterSourceLinks(): Promise<{ chapter_id: string; source_id: string }[]> {
  return check(await supabase().from("chapter_sources").select("chapter_id, source_id"));
}

export { check };

// Pridanie nájdenej štúdie do knižnice (abstrakt sa dotiahne z PubMed).
export async function addFoundSource(f: {
  title: string; authors: string; year: number | null; journal: string; doi: string; pmid: string; url: string; abstract: string;
}): Promise<string> {
  let abstract = f.abstract;
  if (!abstract && f.pmid) {
    const { api } = await import("./supabase");
    abstract = (await api<{ found: { abstract: string } }>(`/api/lookup?pmid=${f.pmid}`).catch(() => null))?.found.abstract ?? "";
  }
  const res = await supabase()
    .from("sources")
    .insert({ kind: "studia", title: f.title, authors: f.authors, year: f.year, journal: f.journal, doi: f.doi, pmid: f.pmid, url: f.url, abstract })
    .select("id")
    .single();
  return check(res).id as string;
}
