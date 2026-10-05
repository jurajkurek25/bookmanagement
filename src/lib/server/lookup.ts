// Overenie a import zdrojov z Crossref (DOI) a PubMed (PMID).
// Čo vráti tento modul, existuje — nič sa tu nevymýšľa.

import type { Source } from "../book";

export type Found = Pick<Source, "title" | "authors" | "year" | "journal" | "doi" | "pmid" | "url" | "abstract">;

const EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

export function normalizeDoi(input: string): string {
  return input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

type CrossrefWork = {
  title?: string[];
  author?: { given?: string; family?: string; name?: string }[];
  issued?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  DOI?: string;
  URL?: string;
  abstract?: string;
};

export function parseCrossref(w: CrossrefWork): Found {
  const authors = (w.author ?? [])
    .map((a) => (a.family ? `${a.family}${a.given ? `, ${a.given.split(/\s+/).map((g) => g[0] + ".").join(" ")}` : ""}` : a.name ?? ""))
    .filter(Boolean)
    .join(", ");
  return {
    title: stripTags(w.title?.[0] ?? ""),
    authors,
    year: w.issued?.["date-parts"]?.[0]?.[0] ?? null,
    journal: w["container-title"]?.[0] ?? "",
    doi: w.DOI ?? "",
    pmid: "",
    url: w.URL ?? "",
    abstract: w.abstract ? stripTags(w.abstract.replace(/<jats:title>[^<]*<\/jats:title>/g, "")) : "",
  };
}

type PubmedSummary = {
  title?: string;
  authors?: { name: string }[];
  pubdate?: string;
  fulljournalname?: string;
  source?: string;
  articleids?: { idtype: string; value: string }[];
};

export function parsePubmedSummary(pmid: string, s: PubmedSummary): Found {
  return {
    title: stripTags(s.title ?? "").replace(/\.$/, ""),
    authors: (s.authors ?? []).map((a) => a.name).join(", "),
    year: Number(s.pubdate?.match(/\d{4}/)?.[0]) || null,
    journal: s.fulljournalname || s.source || "",
    doi: s.articleids?.find((a) => a.idtype === "doi")?.value ?? "",
    pmid,
    url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
    abstract: "",
  };
}

export function parsePubmedAbstract(xml: string): string {
  return [...xml.matchAll(/<AbstractText([^>]*)>([\s\S]*?)<\/AbstractText>/g)]
    .map((m) => {
      const label = m[1].match(/Label="([^"]+)"/)?.[1];
      const body = stripTags(m[2]);
      return label ? `${label}: ${body}` : body;
    })
    .join("\n");
}

async function getJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url, { headers: { "user-agent": "Dielna/1.0 (book research tool)" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${new URL(url).host} odpovedal ${res.status}`);
  return (await res.json()) as T;
}

export async function lookupDoi(doi: string): Promise<Found | null> {
  const d = normalizeDoi(doi);
  const data = await getJson<{ message: CrossrefWork }>(`https://api.crossref.org/works/${encodeURIComponent(d)}`);
  return data ? parseCrossref(data.message) : null;
}

async function pubmedSummaries(ids: string[]): Promise<Found[]> {
  if (!ids.length) return [];
  const data = await getJson<{ result?: Record<string, PubmedSummary> }>(
    `${EUTILS}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`,
  );
  return ids.filter((id) => data?.result?.[id]?.title).map((id) => parsePubmedSummary(id, data!.result![id]));
}

export async function lookupPmid(pmid: string): Promise<Found | null> {
  const id = pmid.trim().replace(/\D/g, "");
  const [found] = await pubmedSummaries([id]);
  if (!found) return null;
  const res = await fetch(`${EUTILS}/efetch.fcgi?db=pubmed&rettype=abstract&retmode=xml&id=${id}`);
  if (res.ok) found.abstract = parsePubmedAbstract(await res.text());
  return found;
}

export async function searchPubmed(term: string, max = 10): Promise<Found[]> {
  const data = await getJson<{ esearchresult?: { idlist?: string[] } }>(
    `${EUTILS}/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${max}&term=${encodeURIComponent(term)}`,
  );
  return pubmedSummaries(data?.esearchresult?.idlist ?? []);
}
