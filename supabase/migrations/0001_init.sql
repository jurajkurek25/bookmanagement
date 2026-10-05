-- Dielňa: schéma pre písanie knihy (Ne)potrebný muž.
-- Každý riadok patrí prihlásenému používateľovi (RLS).

create table public.level_budgets (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  level int not null check (level between 1 and 9),
  target_pages int not null check (target_pages >= 0),
  primary key (user_id, level)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  level int not null check (level between 1 and 9),
  title text not null,
  position int not null default 0,
  status text not null default 'nacrt'
    check (status in ('nacrt', 'vyskum', 'pisanie', 'revizia', 'hotovo')),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}',
  word_count int not null default 0,
  worksheet jsonb not null default '[]',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null default 'studia'
    check (kind in ('studia', 'kniha', 'historicky', 'clanok', 'ine')),
  title text not null,
  authors text not null default '',
  year int,
  journal text not null default '',
  doi text not null default '',
  pmid text not null default '',
  url text not null default '',
  edition_note text not null default '',
  discipline text not null default 'psychologia'
    check (discipline in ('psychologia', 'biologia', 'sociologia', 'historia', 'filozofia')),
  evidence text not null default 'nezaradene'
    check (evidence in ('metaanalyza', 'rct', 'longitudinalna', 'korelacna', 'kvalitativna', 'historicky_pramen', 'nazor', 'nezaradene')),
  replication text not null default 'nezname'
    check (replication in ('replikovane', 'sporne', 'neuspesna', 'nezname')),
  abstract text not null default '',
  summary text not null default '',
  plain text not null default '',
  limitations text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.chapter_sources (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  chapter_id uuid not null references public.chapters on delete cascade,
  source_id uuid not null references public.sources on delete cascade,
  primary key (chapter_id, source_id)
);

create index chapters_user_level on public.chapters (user_id, level, position);
create index sources_user on public.sources (user_id);
create index chapter_sources_source on public.chapter_sources (source_id);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger chapters_touch before update on public.chapters
  for each row execute function public.touch_updated_at();

alter table public.level_budgets enable row level security;
alter table public.chapters enable row level security;
alter table public.sources enable row level security;
alter table public.chapter_sources enable row level security;

create policy "own rows" on public.level_budgets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.chapters for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.sources for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows" on public.chapter_sources for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
