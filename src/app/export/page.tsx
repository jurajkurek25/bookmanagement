"use client";

import { useState } from "react";
import { Packer } from "docx";
import { BOOK_TITLE } from "@/lib/book";
import { fetchChapters, fetchSources } from "@/lib/data";
import { manuscriptToDocx } from "@/lib/export/docx";
import { manuscriptToEpub } from "@/lib/export/epub";
import { manuscriptToPdfDefinition } from "@/lib/export/pdf";
import { buildManuscript } from "@/lib/manuscript";
import { Button, ErrorText, Page } from "@/components/ui";

type Format = "docx" | "epub" | "pdf";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportPage() {
  const [only, setOnly] = useState(false);
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState("");

  async function run(format: Format) {
    setBusy(format);
    setError("");
    try {
      const [chapters, sources] = await Promise.all([fetchChapters("id, level, title, position, content, worksheet"), fetchSources()]);
      const m = buildManuscript(chapters, sources, { onlyWorksheets: only });
      if (!m.parts.length) throw new Error(only ? "Žiadna kapitola zatiaľ nemá pracovný list." : "Zatiaľ nie sú žiadne kapitoly.");
      const date = new Date().toISOString().slice(0, 10);
      const name = `${only ? "Pracovne-listy" : "Nepotrebny-muz"}-${date}`;
      if (format === "docx") download(await Packer.toBlob(manuscriptToDocx(m)), `${name}.docx`);
      if (format === "epub") {
        const zip = await manuscriptToEpub(m, crypto.randomUUID(), new Date());
        download(await zip.generateAsync({ type: "blob", mimeType: "application/epub+zip" }), `${name}.epub`);
      }
      if (format === "pdf") {
        const pdfMake = (await import("pdfmake/build/pdfmake")).default;
        const vfs = (await import("pdfmake/build/vfs_fonts")).default;
        pdfMake.addVirtualFileSystem(vfs);
        download(await pdfMake.createPdf(manuscriptToPdfDefinition(m)).getBlob(), `${name}.pdf`);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  return (
    <Page title="Export" subtitle={`${BOOK_TITLE} — kapitoly zdola nahor (9 → 1), tvrdenia so zdrojmi ako poznámky na konci kapitoly, na konci zoznam zdrojov.`}>
      <ErrorText error={error} />
      <label className="mb-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />
        Len pracovné listy
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["docx", "Word (DOCX)", "Pre korektora a editora."],
            ["epub", "ePub", "Pre čítačky; na Kindle cez Send to Kindle."],
            ["pdf", "PDF", "Formát A5, na tlač a čítanie."],
          ] as [Format, string, string][]
        ).map(([f, title, hint]) => (
          <div key={f} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-4">
            <div className="font-serif text-lg font-bold">{title}</div>
            <p className="flex-1 text-sm text-muted">{hint}</p>
            <Button disabled={!!busy} onClick={() => run(f)}>
              {busy === f ? "Pripravujem…" : "Stiahnuť"}
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Značky tvrdení, farby a podčiarknutia kontroly sa do exportu nedostanú. Tvrdenia bez zdroja a tvoje názory nemajú poznámku.</p>
    </Page>
  );
}
