-- Alatro Geräte Sync: Tabelle und Funktionen für ein EIGENES Supabase Projekt.
-- Im SQL Editor einfügen und mit Run ausführen. Mehrfaches Ausführen ist unschädlich.
--
-- Sicherheit: Die Tabelle ist für den Browser komplett gesperrt (Row Level Security ohne Policy).
-- Zugriff gibt es nur über die zwei Funktionen unten. Als Kennung dient der SHA-256 Hash des
-- Kopplungscodes (64 Hexzeichen), der Inhalt ist im Browser verschlüsselt, der Server sieht
-- weder Code noch Klartext.

create table if not exists public.saves (
  sync_id      text        not null,
  key          text        not null,
  payload      text        not null,
  save_version integer     not null default 0,
  rev          bigint      not null default 1,
  updated_at   timestamptz not null default now(),
  primary key (sync_id, key),
  constraint saves_sync_id_format check (sync_id ~ '^[0-9a-f]{64}$'),
  constraint saves_key_known check (key in ('profile', 'run')),
  constraint saves_payload_size check (length(payload) <= 2000000)
);

alter table public.saves enable row level security;
revoke all on public.saves from anon, authenticated;

-- Alle Einträge eines Codes lesen
create or replace function public.sync_pull(p_id text)
returns table (key text, payload text, save_version integer, rev bigint, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.key, s.payload, s.save_version, s.rev, s.updated_at
  from public.saves s
  where s.sync_id = p_id;
$$;

-- Einen Eintrag schreiben. p_base_rev ist die Revision, auf der der Client aufbaut (0 = neu).
-- Ist die Revision auf dem Server inzwischen höher, wird abgelehnt und die aktuelle Revision gemeldet.
create or replace function public.sync_push(
  p_id text, p_key text, p_payload text, p_version integer, p_base_rev bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur bigint;
begin
  if p_id !~ '^[0-9a-f]{64}$' or p_key not in ('profile', 'run') or length(p_payload) > 2000000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  select rev into cur from public.saves where sync_id = p_id and key = p_key for update;

  if cur is null then
    if p_base_rev <> 0 then
      return jsonb_build_object('ok', false, 'error', 'conflict', 'rev', 0);
    end if;
    insert into public.saves (sync_id, key, payload, save_version, rev)
    values (p_id, p_key, p_payload, p_version, 1);
    return jsonb_build_object('ok', true, 'rev', 1);
  end if;

  if cur <> p_base_rev then
    return jsonb_build_object('ok', false, 'error', 'conflict', 'rev', cur);
  end if;

  update public.saves
     set payload = p_payload, save_version = p_version, rev = cur + 1, updated_at = now()
   where sync_id = p_id and key = p_key;
  return jsonb_build_object('ok', true, 'rev', cur + 1);
end;
$$;

revoke all on function public.sync_pull(text) from public;
revoke all on function public.sync_push(text, text, text, integer, bigint) from public;
grant execute on function public.sync_pull(text) to anon;
grant execute on function public.sync_push(text, text, text, integer, bigint) to anon;
