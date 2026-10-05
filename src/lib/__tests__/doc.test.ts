import { describe, expect, it } from "vitest";
import { claimColor } from "../book";
import { docText, extractClaims, wordCount } from "../doc";
import { claimText, doc, p, source, t } from "./fixtures";

describe("doc", () => {
  it("počíta slová so slovenskou diakritikou", () => {
    expect(wordCount("Čo vieme o mužoch? Dosť málo — zatiaľ.")).toBe(7);
    expect(wordCount("")).toBe(0);
  });

  it("spája tvrdenie rozdelené na viac uzlov", () => {
    const d = doc(
      p(t("Úvod. "), claimText("Muži sú ", "c1", ["s1"]), claimText("osamelí", "c1", ["s1"], false, [{ type: "bold" }]), t(".")),
      p(claimText("Podľa mňa to platí.", "c2", [], true)),
    );
    expect(extractClaims(d)).toEqual([
      { id: "c1", opinion: false, sources: ["s1"], text: "Muži sú osamelí" },
      { id: "c2", opinion: true, sources: [], text: "Podľa mňa to platí." },
    ]);
    expect(docText(d)).toBe("Úvod. Muži sú osamelí.\nPodľa mňa to platí.");
  });
});

describe("claimColor", () => {
  const sources = new Map([
    ["meta", source({ id: "meta", evidence: "metaanalyza", replication: "replikovane" })],
    ["kor", source({ id: "kor", evidence: "korelacna" })],
    ["fail", source({ id: "fail", evidence: "rct", replication: "neuspesna" })],
  ]);
  it("odvodí farbu zo zdrojov", () => {
    expect(claimColor({ opinion: true, sources: [] }, sources)).toBe("opinion");
    expect(claimColor({ opinion: false, sources: [] }, sources)).toBe("red");
    expect(claimColor({ opinion: false, sources: ["zmazany"] }, sources)).toBe("red");
    expect(claimColor({ opinion: false, sources: ["kor"] }, sources)).toBe("yellow");
    expect(claimColor({ opinion: false, sources: ["fail"] }, sources)).toBe("yellow");
    expect(claimColor({ opinion: false, sources: ["kor", "meta"] }, sources)).toBe("green");
  });
});
