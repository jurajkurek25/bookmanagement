import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import JSZip from "jszip";
import { Packer } from "docx";
import { describe, expect, it } from "vitest";
import { manuscriptToDocx } from "../export/docx";
import { manuscriptToEpub } from "../export/epub";
import { manuscriptToPdfDefinition } from "../export/pdf";
import { buildManuscript } from "../manuscript";
import { claimText, doc, p, source, t } from "./fixtures";

const m = buildManuscript(
  [
    {
      level: 8, title: "Nice guy & ja", position: 0,
      worksheet: [{ id: "e1", type: "zavazok", title: "Môj záväzok", instructions: "Na 7 dní sa zaväzujem:" }],
      content: doc(
        { type: "heading", attrs: { level: 2 }, content: [t("Čo vieme")] },
        p(claimText("Muži sú osamelí <často>", "c1", ["s1"])),
        { type: "bulletList", content: [{ type: "listItem", content: [p(t("Prvý krok"))] }] },
      ),
    },
  ],
  [source({ id: "s1", authors: "Cox, D.", year: 2021, title: "Štúdia o priateľstve", doi: "10.1000/xyz" })],
);

describe("export", () => {
  it("DOCX obsahuje text, poznámky aj pracovný list", async () => {
    const buf = await Packer.toBuffer(manuscriptToDocx(m));
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    for (const s of ["Čo vieme", "Muži sú osamelí &lt;často&gt;", "Poznámky", "https://doi.org/10.1000/xyz", "Môj záväzok", "Zdroje"]) {
      expect(xml).toContain(s);
    }
  });

  it("ePub má správnu štruktúru a platné XHTML", async () => {
    const zip = await manuscriptToEpub(m, "test-id", new Date("2026-10-05T12:00:00Z"));
    const buf = await zip.generateAsync({ type: "nodebuffer", mimeType: "application/epub+zip" });
    // mimetype musí byť prvý a nekomprimovaný
    expect(buf.subarray(30, 38).toString()).toBe("mimetype");
    expect(buf.subarray(38, 58).toString()).toBe("application/epub+zip");
    const z = await JSZip.loadAsync(buf);
    expect(Object.keys(z.files)).toEqual(
      expect.arrayContaining(["META-INF/container.xml", "OEBPS/content.opf", "OEBPS/nav.xhtml", "OEBPS/ch001.xhtml", "OEBPS/zdroje.xhtml"]),
    );
    const ch = await z.file("OEBPS/ch001.xhtml")!.async("string");
    expect(ch).toContain("Nice guy &amp; ja");
    expect(ch).toContain('<sup><a id="ref1" href="ch001.xhtml#note1">1</a></sup>');
    // XHTML musí byť well-formed (čítačky inak kapitolu nezobrazia)
    const dir = mkdtempSync(path.join(tmpdir(), "epub-"));
    for (const name of Object.keys(z.files).filter((f) => /\.(xhtml|opf|xml)$/.test(f))) {
      const file = path.join(dir, name.replace(/\//g, "_"));
      writeFileSync(file, await z.file(name)!.async("string"));
      execFileSync("python3", ["-c", "import sys,xml.dom.minidom;xml.dom.minidom.parse(sys.argv[1])", file]);
    }
  });

  it("PDF sa vygeneruje so slovenskou diakritikou", async () => {
    const require = createRequire(import.meta.url);
    const pdfmake = require("pdfmake");
    pdfmake.setFonts(require("pdfmake/fonts/Roboto.js"));
    pdfmake.setUrlAccessPolicy(() => false);
    const buf: Buffer = await pdfmake.createPdf(manuscriptToPdfDefinition(m)).getBuffer();
    const file = path.join(mkdtempSync(path.join(tmpdir(), "pdf-")), "k.pdf");
    writeFileSync(file, buf);
    const txt = execFileSync("pdftotext", [file, "-"]).toString();
    for (const s of ["(Ne)potrebný muž", "Čo vieme", "Muži sú osamelí", "Môj záväzok", "Štúdia o priateľstve"]) {
      expect(txt).toContain(s);
    }
  });
});
