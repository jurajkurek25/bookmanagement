"use client";

// Výstup asistenta. Zámerne bez tlačidla „vložiť do textu“ — kniha je autorova.
export function AssistantResult({ text, actions }: { text: string; actions?: React.ReactNode }) {
  if (!text) return null;
  return (
    <div className="rounded-md border border-line bg-bg p-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Asistent · len pre výskum</div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{text}</div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
