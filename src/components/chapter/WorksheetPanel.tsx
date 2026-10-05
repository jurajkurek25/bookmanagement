"use client";

import { EXERCISE_TEMPLATES, type Exercise, type Source } from "@/lib/book";
import { newId } from "@/lib/supabase";
import { Input, Label, Select, Textarea } from "../ui";

export function WorksheetPanel({ worksheet, sources, onChange }: { worksheet: Exercise[]; sources: Source[]; onChange: (w: Exercise[]) => void }) {
  const update = (id: string, patch: Partial<Exercise>) => onChange(worksheet.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...worksheet];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Kroky, ktoré má čitateľ po kapitole urobiť. Každé cvičenie môže vychádzať z konkrétneho výskumu.</p>
      <Select
        value=""
        onChange={(e) => {
          const t = EXERCISE_TEMPLATES.find((x) => x.type === e.target.value);
          if (t) onChange([...worksheet, { id: newId(), type: t.type, title: t.title, instructions: t.instructions }]);
        }}
      >
        <option value="">+ Pridať cvičenie…</option>
        {EXERCISE_TEMPLATES.map((t) => (
          <option key={t.type} value={t.type}>
            {t.label}
          </option>
        ))}
      </Select>
      {worksheet.map((ex, i) => (
        <div key={ex.id} className="flex flex-col gap-2 rounded-md border border-line p-3">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              {i + 1}. {EXERCISE_TEMPLATES.find((t) => t.type === ex.type)?.label}
            </span>
            <span className="flex gap-2">
              <button disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30">
                ↑
              </button>
              <button disabled={i === worksheet.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30">
                ↓
              </button>
              <button onClick={() => onChange(worksheet.filter((e) => e.id !== ex.id))} className="hover:text-danger">
                Zmazať
              </button>
            </span>
          </div>
          <Input value={ex.title} onChange={(e) => update(ex.id, { title: e.target.value })} />
          <Textarea rows={3} value={ex.instructions} onChange={(e) => update(ex.id, { instructions: e.target.value })} />
          <Label title="Vychádza z výskumu">
            <Select value={ex.sourceId ?? ""} onChange={(e) => update(ex.id, { sourceId: e.target.value || undefined })}>
              <option value="">—</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.authors.split(",")[0] || "—"} {s.year ? `(${s.year})` : ""} · {s.title.slice(0, 60)}
                </option>
              ))}
            </Select>
          </Label>
        </div>
      ))}
    </div>
  );
}
