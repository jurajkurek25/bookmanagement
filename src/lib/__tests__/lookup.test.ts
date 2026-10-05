import { describe, expect, it } from "vitest";
import { normalizeDoi, parseCrossref, parsePubmedAbstract, parsePubmedSummary } from "../server/lookup";

describe("lookup parsers", () => {
  it("normalizuje DOI z odkazu", () => {
    expect(normalizeDoi(" https://doi.org/10.1037/a0012345 ")).toBe("10.1037/a0012345");
    expect(normalizeDoi("doi:10.1/x")).toBe("10.1/x");
  });

  it("číta Crossref", () => {
    const f = parseCrossref({
      title: ["Loneliness &amp; <i>men</i>"],
      author: [{ given: "Julianne Holt", family: "Lunstad" }, { name: "WHO" }],
      issued: { "date-parts": [[2015, 3]] },
      "container-title": ["Perspectives on Psychological Science"],
      DOI: "10.1177/1745691614568352",
      URL: "https://doi.org/10.1177/1745691614568352",
      abstract: "<jats:title>Abstract</jats:title><jats:p>Social isolation matters.</jats:p>",
    });
    expect(f).toMatchObject({
      title: "Loneliness & men",
      authors: "Lunstad, J. H., WHO",
      year: 2015,
      journal: "Perspectives on Psychological Science",
      abstract: "Social isolation matters.",
    });
  });

  it("číta PubMed súhrn a abstrakt", () => {
    const f = parsePubmedSummary("123", {
      title: "Men and suicide.",
      authors: [{ name: "Smith J" }, { name: "Doe A" }],
      pubdate: "2019 Jan",
      source: "Lancet",
      articleids: [{ idtype: "pubmed", value: "123" }, { idtype: "doi", value: "10.1/abc" }],
    });
    expect(f).toMatchObject({ title: "Men and suicide", authors: "Smith J, Doe A", year: 2019, journal: "Lancet", doi: "10.1/abc", pmid: "123" });
    expect(
      parsePubmedAbstract('<Abstract><AbstractText Label="BACKGROUND">Men &amp; <b>risk</b>.</AbstractText><AbstractText>More.</AbstractText></Abstract>'),
    ).toBe("BACKGROUND: Men & risk .\nMore.");
  });
});
