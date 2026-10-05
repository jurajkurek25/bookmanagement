-- Odporúčania Supabase advisora.
alter function public.touch_updated_at() set search_path = '';
create index chapter_sources_user on public.chapter_sources (user_id);
