import { AlignmentType, Document, HeadingLevel, Paragraph, TextRun, type ParagraphChild } from "docx";
import { exerciseScaffold, type Manuscript, type Run } from "../manuscript";

function runs(rs: Run[]): ParagraphChild[] {
  return rs.flatMap((r) => {
    if ("note" in r) return [new TextRun({ text: String(r.note), superScript: true })];
    const lines = r.text.split("\n");
    return lines.map((t, i) => new TextRun({ text: t, bold: r.bold, italics: r.italic, break: i > 0 ? 1 : undefined }));
  });
}

export function manuscriptToDocx(m: Manuscript): Document {
  const children: Paragraph[] = [
    new Paragraph({ text: m.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: m.author, alignment: AlignmentType.CENTER }),
  ];

  for (const part of m.parts) {
    children.push(new Paragraph({ text: `${part.level}. ${part.name}`, heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
    for (const ch of part.chapters) {
      children.push(new Paragraph({ text: ch.title, heading: HeadingLevel.HEADING_2, pageBreakBefore: true }));
      for (const b of ch.blocks) {
        if (b.kind === "heading") {
          children.push(new Paragraph({ children: runs(b.runs), heading: b.level === 2 ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4 }));
        } else if (b.kind === "quote") {
          children.push(new Paragraph({ children: runs(b.runs), indent: { left: 720 }, style: "Quote" }));
        } else if (b.kind === "bullet") {
          children.push(new Paragraph({ children: runs(b.runs), bullet: { level: 0 } }));
        } else if (b.kind === "number") {
          children.push(new Paragraph({ children: [new TextRun("– "), ...runs(b.runs)], indent: { left: 360 } }));
        } else {
          children.push(new Paragraph({ children: runs(b.runs), spacing: { after: 160 } }));
        }
      }
      if (ch.worksheet.length) {
        children.push(new Paragraph({ text: "Pracovný list", heading: HeadingLevel.HEADING_3, pageBreakBefore: ch.blocks.length > 0 }));
        for (const ex of ch.worksheet) {
          children.push(new Paragraph({ text: ex.title, heading: HeadingLevel.HEADING_4 }));
          children.push(new Paragraph({ text: ex.instructions }));
          for (const line of exerciseScaffold(ex)) children.push(new Paragraph({ text: line, spacing: { before: 200 } }));
        }
      }
      if (ch.notes.length) {
        children.push(new Paragraph({ text: "Poznámky", heading: HeadingLevel.HEADING_3 }));
        ch.notes.forEach((n, i) => children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${n}`, size: 18 })] })));
      }
    }
  }

  if (m.bibliography.length) {
    children.push(new Paragraph({ text: "Zdroje", heading: HeadingLevel.HEADING_1, pageBreakBefore: true }));
    for (const b of m.bibliography) children.push(new Paragraph({ text: b, spacing: { after: 120 } }));
  }

  return new Document({
    creator: m.author,
    title: m.title,
    styles: { default: { document: { run: { font: "Georgia", size: 24 } } } },
    sections: [{ children }],
  });
}
