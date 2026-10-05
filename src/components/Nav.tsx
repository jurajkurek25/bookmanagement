"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const LINKS = [
  { href: "/", label: "Pyramída" },
  { href: "/zdroje", label: "Zdroje" },
  { href: "/tvrdenia", label: "Tvrdenia" },
  { href: "/matica", label: "Matica" },
  { href: "/kontrola", label: "Kontrola" },
  { href: "/export", label: "Export" },
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/uroven") || path.startsWith("/kapitola") : path.startsWith(href));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2">
        <Link href="/" className="mr-3 shrink-0 font-serif text-lg font-bold text-gold">
          Dielňa
        </Link>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm ${active(l.href) ? "bg-gold-soft font-medium text-ink" : "text-muted hover:text-ink"}`}
          >
            {l.label}
          </Link>
        ))}
        <button onClick={() => supabase().auth.signOut()} className="ml-auto shrink-0 text-sm text-muted hover:text-ink">
          Odhlásiť
        </button>
      </nav>
    </header>
  );
}
