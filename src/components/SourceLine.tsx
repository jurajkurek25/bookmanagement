import { DISCIPLINES, EVIDENCE, label, type Source } from "@/lib/book";

export function SourceLine({ s, showPlain = true }: { s: Source; showPlain?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-sm font-medium" title={s.title}>
        {s.authors ? `${s.authors.split(",")[0]}${s.authors.includes(",") ? " a kol." : ""}` : "—"}
        {s.year ? ` (${s.year})` : ""} · {s.title}
      </div>
      <div className="text-xs text-muted">
        {label(DISCIPLINES, s.discipline)} · {label(EVIDENCE, s.evidence)}
        {s.replication === "neuspesna" && <span className="text-danger"> · neúspešná replikácia</span>}
        {s.replication === "sporne" && <span className="text-danger"> · sporné</span>}
      </div>
      {showPlain && (s.plain ? <p className="mt-1 text-sm italic">„{s.plain}“</p> : <p className="mt-1 text-xs text-muted">Chýba „Ľudsky“ — doplň v knižnici zdrojov.</p>)}
    </div>
  );
}
