"use client";

import { useState } from "react";
import { CLAIM_COLORS, claimColor, type Source } from "@/lib/book";
import type { ClaimAttrs } from "@/lib/doc";
import { SourceLine } from "../SourceLine";
import { Button } from "../ui";

type Props = {
  claim: ClaimAttrs;
  text: string;
  sources: Source[];
  linkedIds: Set<string>;
  sourcesById: Map<string, Source>;
  onChange: (attrs: ClaimAttrs | null) => void;
};

export function ClaimPanel({ claim, text, sources, linkedIds, sourcesById, onChange }: Props) {
  const [all, setAll] = useState(false);
  const color = CLAIM_COLORS[claimColor(claim, sourcesById)];
  const shown = sources.filter((s) => all || linkedIds.has(s.id) || claim.sources.includes(s.id));

  const toggle = (id: string) =>
    onChange({ ...claim, sources: claim.sources.includes(id) ? claim.sources.filter((x) => x !== id) : [...claim.sources, id] });

  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif">„{text}“</p>
      <p className="text-sm">
        {color.dot} {color.label}
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={claim.opinion} onChange={(e) => onChange({ ...claim, opinion: e.target.checked })} />
        Je to môj názor / osobná skúsenosť (nepotrebuje zdroj)
      </label>
      {!claim.opinion && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Opiera sa o</span>
            <button className="text-xs text-gold underline" onClick={() => setAll(!all)}>
              {all ? "Len zdroje kapitoly" : "Celá knižnica"}
            </button>
          </div>
          {shown.length === 0 && <p className="text-sm text-muted">Kapitola zatiaľ nemá zdroje. Pridaj ich v záložke Zdroje alebo prepni na celú knižnicu.</p>}
          <ul className="flex flex-col gap-2">
            {shown.map((s) => (
              <li key={s.id} className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={claim.sources.includes(s.id)} onChange={() => toggle(s.id)} />
                <SourceLine s={s} showPlain={false} />
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Farbu určuje sila dôkazu: metaanalýza, experiment alebo dlhodobá štúdia (bez spornej replikácie) = 🟢, ostatné = 🟡.</p>
        </>
      )}
      <Button variant="danger" onClick={() => onChange(null)}>
        Zrušiť označenie tvrdenia
      </Button>
    </div>
  );
}
