// Definícia dokumentu pre pdfmake (písmo Roboto má slovenskú diakritiku).
import { exerciseScaffold, type Manuscript, type Run } from "../manuscript";

type Content = Record<string, unknown> | string;

function text(rs: Run[]): Content[] {
  return rs.map((r) =>
    "note" in r ? { text: String(r.note), sup: true, fontSize: 8 } : { text: r.text, bold: r.bold, italics: r.italic },
  );
}

export function manuscriptToPdfDefinition(m: Manuscript): Record<string, unknown> {
  const content: Content[] = [
    { text: m.title, style: "title", margin: [0, 200, 0, 12] },
    { text: m.author, alignment: "center" },
  ];
  for (const part of m.parts) {
    content.push({ text: `${part.level}. ${part.name}`, style: "part", pageBreak: "before" });
    for (const ch of part.chapters) {
      content.push({ text: ch.title, style: "chapter", pageBreak: "before" });
      let bullets: Content[] = [];
      const flush = () => {
        if (bullets.length) content.push({ ul: bullets, margin: [0, 0, 0, 8] });
        bullets = [];
      };
      for (const b of ch.blocks) {
        if (b.kind === "bullet" || b.kind === "number") {
          bullets.push({ text: text(b.runs) });
          continue;
        }
        flush();
        if (b.kind === "heading") content.push({ text: text(b.runs), style: b.level === 2 ? "h2" : "h3" });
        else if (b.kind === "quote") content.push({ text: text(b.runs), italics: true, margin: [24, 0, 24, 8] });
        else content.push({ text: text(b.runs), style: "p" });
      }
      flush();
      if (ch.worksheet.length) {
        content.push({ text: "Pracovný list", style: "h2", pageBreak: ch.blocks.length ? "before" : undefined });
        for (const ex of ch.worksheet) {
          content.push({ text: ex.title, style: "h3" });
          content.push({ text: ex.instructions, style: "p" });
          for (const line of exerciseScaffold(ex)) content.push({ text: line || " ", margin: [0, 6, 0, 6], color: "#555" });
        }
      }
      if (ch.notes.length) {
        content.push({ text: "Poznámky", style: "h3" });
        content.push({ ol: ch.notes.map((n) => ({ text: n, fontSize: 9 })) });
      }
    }
  }
  if (m.bibliography.length) {
    content.push({ text: "Zdroje", style: "part", pageBreak: "before" });
    for (const b of m.bibliography) content.push({ text: b, fontSize: 9, margin: [0, 0, 0, 4] });
  }
  return {
    info: { title: m.title, author: m.author },
    pageSize: "A5",
    pageMargins: [48, 56, 48, 56],
    defaultStyle: { font: "Roboto", fontSize: 10.5, lineHeight: 1.3 },
    footer: (page: number) => ({ text: String(page), alignment: "center", fontSize: 8, margin: [0, 20, 0, 0] }),
    styles: {
      title: { fontSize: 26, bold: true, alignment: "center" },
      part: { fontSize: 20, bold: true, alignment: "center", margin: [0, 160, 0, 0] },
      chapter: { fontSize: 17, bold: true, margin: [0, 24, 0, 14] },
      h2: { fontSize: 13, bold: true, margin: [0, 12, 0, 6] },
      h3: { fontSize: 11.5, bold: true, margin: [0, 10, 0, 4] },
      p: { margin: [0, 0, 0, 8], alignment: "justify" },
    },
    content,
  };
}
