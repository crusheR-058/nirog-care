-- Nirog — Realtime publication membership (version-controlled; gap #3).
-- The doctor portal (queue-realtime.tsx) and the patient app both rely on
-- postgres_changes for these tables. Membership previously lived only in the
-- Supabase dashboard; this makes it reproducible. Idempotent.
-- Apply with: psql $DIRECT_URL -f supabase/realtime.sql

do $$
declare
  t text;
begin
  foreach t in array array['QueueEntry', 'AriaHandover', 'Encounter'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Realtime delivers UPDATE/DELETE payloads with full OLD row data only when
-- REPLICA IDENTITY FULL is set (needed so the patient app sees which columns
-- changed, e.g. doctorId being filled on pick-up).
alter table public."QueueEntry" replica identity full;
