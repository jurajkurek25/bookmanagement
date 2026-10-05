import JSZip from "jszip";
import { exerciseScaffold, type Manuscript, type MChapter, type Run } from "../manuscript";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(rs: Run[], chapterFile: string): string {
  return rs
    .map((r) => {
      if ("note" in r) return `<sup><a id="ref${r.note}" href="${chapterFile}#note${r.note}">${r.note}</a></sup>`;
      let t = esc(r.text).replace(/\n/g, "<br/>");
      if (r.italic) t = `<em>${t}</em>`;
      if (r.bold) t = `<strong>${t}</strong>`;
      return t;
    })
    .join("");
}

function page(title: string, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="sk" lang="sk">
<head><meta charset="UTF-8"/><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>
${body}
</body>
</html>`;
}

function chapterBody(ch: MChapter, file: string, partTitle: string | null): string {
  const out: string[] = [];
  if (partTitle) out.push(`<h1 class="part">${esc(partTitle)}</h1>`);
  out.push(`<h2>${esc(ch.title)}</h2>`);
  let list: "ul" | "ol" | null = null;
  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const b of ch.blocks) {
    const want = b.kind === "bullet" ? "ul" : b.kind === "number" ? "ol" : null;
    if (want !== list) {
      closeList();
      if (want) out.push(`<${want}>`);
      list = want;
    }
    const html = inline(b.runs, file);
    if (b.kind === "heading") out.push(`<h${b.level + 1}>${html}</h${b.level + 1}>`);
    else if (b.kind === "quote") out.push(`<blockquote><p>${html}</p></blockquote>`);
    else if (want) out.push(`<li>${html}</li>`);
    else out.push(`<p>${html}</p>`);
  }
  closeList();
  if (ch.worksheet.length) {
    out.push(`<section class="worksheet"><h3>Pracovný list</h3>`);
    for (const ex of ch.worksheet) {
      out.push(`<h4>${esc(ex.title)}</h4><p>${esc(ex.instructions)}</p>`);
      for (const line of exerciseScaffold(ex)) out.push(`<p class="line">${esc(line) || "&#160;"}</p>`);
    }
    out.push(`</section>`);
  }
  if (ch.notes.length) {
    out.push(`<section class="notes" epub:type="endnotes"><h3>Poznámky</h3><ol>`);
    ch.notes.forEach((n, i) => out.push(`<li id="note${i + 1}" epub:type="endnote">${esc(n)} <a href="${file}#ref${i + 1}">↩</a></li>`));
    out.push(`</ol></section>`);
  }
  return out.join("\n");
}

const CSS = `body{font-family:Georgia,serif;line-height:1.5;margin:0 5%}
h1,h2,h3,h4{font-family:Georgia,serif;line-height:1.2}
h1.part{text-align:center;margin-top:30%}
blockquote{margin:1em 2em;font-style:italic}
.notes{font-size:0.85em;border-top:1px solid #999;margin-top:2em}
.worksheet .line{color:#555}
.title{text-align:center;margin-top:30%}`;

export async function manuscriptToEpub(m: Manuscript, id: string, modified: Date): Promise<JSZip> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
  );
  const oebps = zip.folder("OEBPS")!;
  oebps.file("style.css", CSS);

  const items: { file: string; title: string }[] = [{ file: "title.xhtml", title: m.title }];
  oebps.file("title.xhtml", page(m.title, `<h1 class="title">${esc(m.title)}</h1><p class="title">${esc(m.author)}</p>`));

  let n = 0;
  for (const part of m.parts) {
    part.chapters.forEach((ch, i) => {
      const file = `ch${String(++n).padStart(3, "0")}.xhtml`;
      oebps.file(file, page(ch.title, chapterBody(ch, file, i === 0 ? `${part.level}. ${part.name}` : null)));
      items.push({ file, title: ch.title });
    });
  }
  if (m.bibliography.length) {
    oebps.file("zdroje.xhtml", page("Zdroje", `<h1>Zdroje</h1>\n${m.bibliography.map((b) => `<p>${esc(b)}</p>`).join("\n")}`));
    items.push({ file: "zdroje.xhtml", title: "Zdroje" });
  }

  oebps.file(
    "nav.xhtml",
    page("Obsah", `<nav epub:type="toc" id="toc"><h1>Obsah</h1><ol>\n${items.map((it) => `<li><a href="${it.file}">${esc(it.title)}</a></li>`).join("\n")}\n</ol></nav>`),
  );

  const stamp = modified.toISOString().replace(/\.\d{3}Z$/, "Z");
  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="sk">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="bookid">urn:uuid:${esc(id)}</dc:identifier>
<dc:title>${esc(m.title)}</dc:title>
<dc:creator>${esc(m.author)}</dc:creator>
<dc:language>sk</dc:language>
<meta property="dcterms:modified">${stamp}</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="css" href="style.css" media-type="text/css"/>
${items.map((it, i) => `<item id="i${i}" href="${it.file}" media-type="application/xhtml+xml"/>`).join("\n")}
</manifest>
<spine>
${items.map((_, i) => `<itemref idref="i${i}"/>`).join("\n")}
</spine>
</package>`,
  );
  return zip;
}
