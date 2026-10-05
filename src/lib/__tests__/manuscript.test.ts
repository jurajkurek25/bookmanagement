import { describe, expect, it } from "vitest";
import { buildManuscript } from "../manuscript";
import { claimText, doc, p, source, t } from "./fixtures";

const sources = [
  source({ id: "s1", authors: "Glover, R.", year: 2003, title: "No More Mr. Nice Guy" }),
  source({ id: "s2", authors: "Frankl, V. E.", year: 1946, title: "Človek hľadá zmysel" }),
  source({ id: "unused", authors: "Nikto", title: "Necitované" }),
];

const chapters = [
  {
    level: 8, title: "Nice guy", position: 0, worksheet: [],
    content: doc(
      p(t("Úvod. "), claimText("Milí muži potláčajú hnev", "c1", ["s1"]), t(". "), claimText("Myslím si to.", "c2", [], true)),
      p(claimText("Bez zdroja.", "c3", [])),
      p(claimText("Zmysel drží pri živote", "c4", ["s2", "s1"])),
    ),
  },
  { level: 9, title: "Korene", position: 0, content: doc(p(t("Stoici."))), worksheet: [{ id: "e", type: "navyk" as const, title: "Ráno", instructions: "Zaškrtni." }] },
  { level: 3, title: "Prázdna", position: 0, content: doc(p()), worksheet: [] },
];

describe("buildManuscript", () => {
  const m = buildManuscript(chapters, sources);

  it("radí časti zdola nahor (9 → 1)", () => {
    expect(m.parts.map((x) => x.level)).toEqual([9, 8, 3]);
  });

  it("mení tvrdenia so zdrojom na poznámky, názory a tvrdenia bez zdroja nie", () => {
    const ch = m.parts[1].chapters[0];
    expect(ch.blocks[0].runs).toEqual([{ text: "Úvod. " }, { text: "Milí muži potláčajú hnev" }, { note: 1 }, { text: ". " }, { text: "Myslím si to." }]);
    expect(ch.blocks[1].runs).toEqual([{ text: "Bez zdroja." }]);
    expect(ch.blocks[2].runs.at(-1)).toEqual({ note: 2 });
    expect(ch.notes).toEqual([
      "Glover, R. (2003). No More Mr. Nice Guy.",
      "Frankl, V. E. (1946). Človek hľadá zmysel. Glover, R. (2003). No More Mr. Nice Guy.",
    ]);
  });

  it("bibliografia obsahuje len citované zdroje", () => {
    expect(m.bibliography).toEqual(["Frankl, V. E. (1946). Človek hľadá zmysel.", "Glover, R. (2003). No More Mr. Nice Guy."]);
  });

  it("vie exportovať len pracovné listy", () => {
    const w = buildManuscript(chapters, sources, { onlyWorksheets: true });
    expect(w.parts.map((x) => x.chapters.map((c) => c.title))).toEqual([["Korene"]]);
    expect(w.bibliography).toEqual([]);
  });
});
