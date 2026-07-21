-- Nirog — pharmacy access layer (companion to policies.sql / patient-access.sql).
-- A partner pharmacy authenticates against the SAME Supabase project as doctors
-- and patients; RLS scopes it to its own row only. Additive and idempotent.
-- Apply with: psql $DIRECT_URL -f supabase/pharmacy.sql

-- Map the current auth user → their Pharmacy.id.
create or replace function public.current_pharmacy_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public."Pharmacy" where "authUserId" = auth.uid()
$$;

alter table public."Pharmacy" enable row level security;

-- A pharmacy reads and updates only its own row. Creation happens server-side
-- with the service role (registerPharmacy), same as Doctor.
drop policy if exists pharmacy_select_self on public."Pharmacy";
create policy pharmacy_select_self on public."Pharmacy" for select to authenticated
  using ("authUserId" = auth.uid());

drop policy if exists pharmacy_update_self on public."Pharmacy";
create policy pharmacy_update_self on public."Pharmacy" for update to authenticated
  using ("authUserId" = auth.uid())
  with check ("authUserId" = auth.uid());

-- ── Storage: private verification documents ──
-- Path convention: pharmacy-documents/<pharmacyId>/<key>-<filename>
insert into storage.buckets (id, name, public)
  values ('pharmacy-documents', 'pharmacy-documents', false)
  on conflict (id) do nothing;

drop policy if exists nirog_pharmacy_docs_select on storage.objects;
create policy nirog_pharmacy_docs_select on storage.objects for select to authenticated
  using (
    bucket_id = 'pharmacy-documents'
    and (storage.foldername(name))[1] = public.current_pharmacy_id()
  );

drop policy if exists nirog_pharmacy_docs_insert on storage.objects;
create policy nirog_pharmacy_docs_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'pharmacy-documents'
    and (storage.foldername(name))[1] = public.current_pharmacy_id()
  );

drop policy if exists nirog_pharmacy_docs_delete on storage.objects;
create policy nirog_pharmacy_docs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'pharmacy-documents'
    and (storage.foldername(name))[1] = public.current_pharmacy_id()
  );
