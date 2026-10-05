import { describe, expect, it } from "vitest";
import { analyze, chapterWarnings } from "../rules";

const ids = (s: string) => analyze(s).map((i) => i.ruleId);

describe("analyze", () => {
  it("nachádza žargón v rôznych tvaroch", () => {
    expect(ids("Táto korelácia je slabá.")).toEqual(["korelacia"]);
    expect(ids("Našli koreláciu medzi spánkom a náladou.")).toEqual(["korelacia"]);
    expect(ids("Podľa metaanalýz z roku 2019")).toEqual(["metaanalyza"]);
  });

  it("vracia presnú pozíciu nálezu", () => {
    const [i] = analyze("Hladina kortizolu stúpa.");
    expect(i.match).toBe("kortizolu");
    expect("Hladina kortizolu stúpa.".slice(i.from, i.to)).toBe("kortizolu");
  });

  it("nehlási časti iných slov", () => {
    expect(ids("abeceda, alfabet a dominik")).toEqual([]);
  });

  it("hlási manosférový jazyk", () => {
    expect(ids("Nechcem byť alfa samec.")).toEqual(["alfa"]);
    expect(ids("Red pill má jadro pravdy.")).toEqual(["redpill"]);
    expect(ids("Všetky ženy chcú to isté.")).toEqual(["zeny-su"]);
    expect(ids("Toto robí skutočný muž.")).toEqual(["skutocny-muz"]);
  });

  it("hlási jazyk o samovražde podľa WHO", () => {
    expect(ids("Jeho otec spáchal samovraždu.")).toEqual(["spachat"]);
    expect(ids("Bol to neúspešný pokus.")).toEqual(["pokus"]);
    expect(ids("Kamarát bol feťák.")).toEqual(["fetak"]);
  });

  it("filtruje podľa kategórie", () => {
    expect(analyze("korelácia a alfa", ["ton"]).map((i) => i.ruleId)).toEqual(["alfa"]);
  });
});

describe("chapterWarnings", () => {
  it("upozorní na chýbajúci kontakt na pomoc", () => {
    expect(chapterWarnings("Muži zomierajú samovraždou štyrikrát častejšie.")).toHaveLength(1);
    expect(chapterWarnings("Muži zomierajú samovraždou. Ak ti je zle, zavolaj na Linku dôvery.")).toHaveLength(0);
    expect(chapterWarnings("Kapitola o spánku.")).toHaveLength(0);
  });
});
