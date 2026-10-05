"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { isConfigured, supabase } from "@/lib/supabase";
import { Nav } from "./Nav";
import { Button, Input } from "./ui";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!isConfigured()) return;
    supabase().auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase().auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!isConfigured()) {
    return (
      <Centered>
        <h1 className="font-serif text-2xl mb-3">Dielňa nie je nastavená</h1>
        <p className="text-muted">
          Chýbajú premenné <code>NEXT_PUBLIC_SUPABASE_URL</code> a <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Postup je v README.
        </p>
      </Centered>
    );
  }
  if (session === undefined) return null;
  if (!session) return <Login />;
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">{children}</div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) setError("Prihlásenie zlyhalo. Skontroluj e-mail a heslo.");
    setBusy(false);
  }

  return (
    <Centered>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h1 className="font-serif text-2xl">Dielňa</h1>
        <p className="text-sm text-muted">(Ne)potrebný muž</p>
        <Input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <Input type="password" placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy}>
          Prihlásiť sa
        </Button>
      </form>
    </Centered>
  );
}
