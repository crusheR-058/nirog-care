-- Nirog — fulfilment access layer (the "Fulfil" step of the care loop).
-- Companion to policies.sql / patient-access.sql / pharmacy.sql.
--
-- Shape: a filed Encounter mints a Prescription, which is routed to the
-- patient's district as an UNASSIGNED PharmacyOrder (pharmacyId = NULL). Any
-- VERIFIED pharmacy serving that district may atomically claim it — the same
-- pool-and-claim pattern as the on-demand doctor queue.
--
-- Privacy boundary: a pharmacy NEVER gains access to Patient, Encounter or
-- AriaHandover. It sees the prescription lines it must dispense plus a delivery
-- snapshot (name / phone / village) denormalised onto the order. Widening that
-- requires a new consent scope, not a new join.
--
-- Additive and idempotent.
-- Apply with: psql $DIRECT_URL -f supabase/fulfilment.sql

-- ── Helpers ──────────────────────────────────────────────────────────────────

-- Is the current auth user a pharmacy that has passed licence verification?
-- Unverified pharmacies can complete onboarding but must never see a real
-- prescription.
create or replace function public.current_pharmacy_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select verified from public."Pharmacy" where "authUserId" = auth.uid()),
    false
  )
$$;

-- Does the current pharmacy serve the geography an order was routed to?
-- District is the primary key for routing; state is the fallback so a district
-- with no partner pharmacy still gets covered rather than stranding the order.
create or replace function public.pharmacy_serves(o_district text, o_state text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."Pharmacy" p
    where p."authUserId" = auth.uid()
      and p.verified
      and (
        (p.district is not null and o_district is not null
           and lower(p.district) = lower(o_district))
        or (p.state is not null and o_state is not null
           and lower(p.state) = lower(o_state))
      )
  )
$$;

-- Can the current session read this prescription at all?
-- Prescriber, the patient's own account, or the pharmacy holding its order.
create or replace function public.prescription_readable(pres_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."Prescription" pr
    where pr.id = pres_id
      and (
        pr."doctorId" = public.current_doctor_id()
        or public.account_owns_patient(pr."patientId")
        or exists (
          select 1 from public."PharmacyOrder" o
          where o."prescriptionId" = pr.id
            and o."pharmacyId" = public.current_pharmacy_id()
        )
      )
  )
$$;

-- ── Drug catalogue (WHO ATC) ─────────────────────────────────────────────────
-- Public reference data: no PII, readable by any signed-in user (doctors search
-- it to prescribe, pharmacies to dispense). Writes are service-role only.

alter table public."Drug" enable row level security;

drop policy if exists drug_select_all on public."Drug";
create policy drug_select_all on public."Drug" for select to authenticated
  using (true);

-- Trigram index so ILIKE '%name%' over 5k substances stays instant.
create extension if not exists pg_trgm;
create index if not exists drug_searchtext_trgm
  on public."Drug" using gin ("searchText" gin_trgm_ops);

-- ── Prescription ─────────────────────────────────────────────────────────────

alter table public."Prescription" enable row level security;

drop policy if exists prescription_select on public."Prescription";
create policy prescription_select on public."Prescription" for select to authenticated
  using (
    "doctorId" = public.current_doctor_id()
    or public.account_owns_patient("patientId")
    or exists (
      select 1 from public."PharmacyOrder" o
      where o."prescriptionId" = "Prescription".id
        and o."pharmacyId" = public.current_pharmacy_id()
    )
  );

-- Only the prescribing clinician may issue one.
drop policy if exists prescription_insert_own on public."Prescription";
create policy prescription_insert_own on public."Prescription" for insert to authenticated
  with check ("doctorId" = public.current_doctor_id());

-- The prescriber may amend status (e.g. cancel) on their own prescription.
drop policy if exists prescription_update_own on public."Prescription";
create policy prescription_update_own on public."Prescription" for update to authenticated
  using ("doctorId" = public.current_doctor_id())
  with check ("doctorId" = public.current_doctor_id());

-- ── PrescriptionItem ─────────────────────────────────────────────────────────

alter table public."PrescriptionItem" enable row level security;

drop policy if exists prescription_item_select on public."PrescriptionItem";
create policy prescription_item_select on public."PrescriptionItem" for select to authenticated
  using (public.prescription_readable("prescriptionId"));

drop policy if exists prescription_item_insert on public."PrescriptionItem";
create policy prescription_item_insert on public."PrescriptionItem" for insert to authenticated
  with check (exists (
    select 1 from public."Prescription" pr
    where pr.id = "prescriptionId" and pr."doctorId" = public.current_doctor_id()
  ));

-- ── PharmacyOrder ────────────────────────────────────────────────────────────

alter table public."PharmacyOrder" enable row level security;

-- 1. The unassigned pool: a verified pharmacy serving this geography.
drop policy if exists order_select_pool on public."PharmacyOrder";
create policy order_select_pool on public."PharmacyOrder" for select to authenticated
  using (
    "pharmacyId" is null
    and status = 'routed'
    and public.pharmacy_serves(district, state)
  );

-- 2. Orders this pharmacy already holds.
drop policy if exists order_select_own on public."PharmacyOrder";
create policy order_select_own on public."PharmacyOrder" for select to authenticated
  using ("pharmacyId" = public.current_pharmacy_id());

-- 3. The prescriber tracks fulfilment of what they wrote; the patient's account
--    tracks their own order.
drop policy if exists order_select_clinical on public."PharmacyOrder";
create policy order_select_clinical on public."PharmacyOrder" for select to authenticated
  using (public.prescription_readable("prescriptionId"));

-- 4. Routing: the prescribing doctor creates the order when filing the note.
drop policy if exists order_insert_by_prescriber on public."PharmacyOrder";
create policy order_insert_by_prescriber on public."PharmacyOrder" for insert to authenticated
  with check (exists (
    select 1 from public."Prescription" pr
    where pr.id = "prescriptionId" and pr."doctorId" = public.current_doctor_id()
  ));

-- 5. The atomic claim. USING matches only while still unassigned + routed, so a
--    second pharmacy's identical update affects 0 rows once the first commits.
--    WITH CHECK forces the claimer to assign the order to *itself*.
drop policy if exists order_claim on public."PharmacyOrder";
create policy order_claim on public."PharmacyOrder" for update to authenticated
  using (
    "pharmacyId" is null
    and status = 'routed'
    and public.pharmacy_serves(district, state)
  )
  with check ("pharmacyId" = public.current_pharmacy_id());

-- 6. Progressing an order the pharmacy already holds (it cannot hand it off).
drop policy if exists order_update_own on public."PharmacyOrder";
create policy order_update_own on public."PharmacyOrder" for update to authenticated
  using ("pharmacyId" = public.current_pharmacy_id())
  with check ("pharmacyId" = public.current_pharmacy_id());

-- ── OrderEvent (append-only fulfilment trail) ────────────────────────────────

alter table public."OrderEvent" enable row level security;

drop policy if exists order_event_select on public."OrderEvent";
create policy order_event_select on public."OrderEvent" for select to authenticated
  using (exists (
    select 1 from public."PharmacyOrder" o
    where o.id = "orderId"
      and (
        o."pharmacyId" = public.current_pharmacy_id()
        or public.prescription_readable(o."prescriptionId")
      )
  ));

-- Only the pharmacy holding the order appends to its trail. No update/delete
-- policy exists, so the trail is append-only by construction.
drop policy if exists order_event_insert on public."OrderEvent";
create policy order_event_insert on public."OrderEvent" for insert to authenticated
  with check (exists (
    select 1 from public."PharmacyOrder" o
    where o.id = "orderId" and o."pharmacyId" = public.current_pharmacy_id()
  ));

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- The pharmacy console subscribes to its pool and its own orders.
do $$
begin
  alter publication supabase_realtime add table public."PharmacyOrder";
exception when duplicate_object then null;
end $$;

-- ── Storage: doctor verification documents ───────────────────────────────────
-- Recorded here for reproducibility — the bucket and its policies were created
-- live via the Management API and were previously missing from source control.
-- Path convention: doctor-documents/<doctorId>/<key>-<filename>
insert into storage.buckets (id, name, public)
  values ('doctor-documents', 'doctor-documents', false)
  on conflict (id) do nothing;

drop policy if exists nirog_docdocs_select on storage.objects;
create policy nirog_docdocs_select on storage.objects for select to authenticated
  using (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = public.current_doctor_id()
  );

drop policy if exists nirog_docdocs_insert on storage.objects;
create policy nirog_docdocs_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = public.current_doctor_id()
  );

drop policy if exists nirog_docdocs_delete on storage.objects;
create policy nirog_docdocs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = public.current_doctor_id()
  );

-- ── Ranked catalogue search ──────────────────────────────────────────────────
-- Plain alphabetical ordering is actively unsafe for prescribing: searching
-- "amlodipine" surfaced the combination product "aliskiren and amlodipine"
-- first, purely because 'al' < 'am'. Rank exact and prefix matches above
-- substring matches, and prefer shorter (i.e. single-substance) names.
create or replace function public.search_drugs(
  q text default '',
  grp text default null,
  lim int default 40,
  off int default 0
)
returns setof public."Drug"
language sql stable security invoker set search_path = public as $$
  select d.* from public."Drug" d
  where (grp is null or d."anatomicalCode" = grp)
    and (
      q = '' or d."searchText" like '%' || lower(q) || '%'
    )
  order by
    case
      when q = '' then 3
      when lower(d.name) = lower(q) then 0
      when upper(d."atcCode") = upper(q) then 0
      when lower(d.name) like lower(q) || '%' then 1
      when upper(d."atcCode") like upper(q) || '%' then 1
      when lower(d.name) like '% ' || lower(q) || '%' then 2
      else 3
    end,
    -- Shorter names win only when ranking a real query (single substances beat
    -- combination products). With no query that would surface "Oil"/"Alum"
    -- first, so browse mode is plain alphabetical.
    case when q = '' then 0 else length(d.name) end,
    d.name
  limit least(lim, 100) offset off
$$;

-- Matching count for the same predicate (the function returns a page).
create or replace function public.count_drugs(
  q text default '',
  grp text default null
)
returns bigint
language sql stable security invoker set search_path = public as $$
  select count(*) from public."Drug" d
  where (grp is null or d."anatomicalCode" = grp)
    and (q = '' or d."searchText" like '%' || lower(q) || '%')
$$;

-- ── Pool visibility fix ──────────────────────────────────────────────────────
-- A pharmacy must see WHAT it is being asked to dispense before deciding to
-- accept — otherwise it cannot know whether it holds the stock. The original
-- prescription_select only granted access once the order was claimed, which
-- left pool cards empty.
--
-- Mirrors the doctor-side boundary (triage + reason before accept, full chart
-- after): here the pharmacy sees medication lines for orders routed to its own
-- district, and never anything clinical.
create or replace function public.prescription_in_my_pool(pres_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."PharmacyOrder" o
    where o."prescriptionId" = pres_id
      and o."pharmacyId" is null
      and o.status = 'routed'
      and public.pharmacy_serves(o.district, o.state)
  )
$$;

drop policy if exists prescription_select on public."Prescription";
create policy prescription_select on public."Prescription" for select to authenticated
  using (
    "doctorId" = public.current_doctor_id()
    or public.account_owns_patient("patientId")
    or exists (
      select 1 from public."PharmacyOrder" o
      where o."prescriptionId" = "Prescription".id
        and o."pharmacyId" = public.current_pharmacy_id()
    )
    or public.prescription_in_my_pool(id)
  );

drop policy if exists prescription_item_select on public."PrescriptionItem";
create policy prescription_item_select on public."PrescriptionItem" for select to authenticated
  using (
    public.prescription_readable("prescriptionId")
    or public.prescription_in_my_pool("prescriptionId")
  );

-- ── Close the prescription when the order is delivered ───────────────────────
-- Doing this from the app failed silently: prescription_update_own only lets
-- the PRESCRIBING DOCTOR update the row, and the pharmacy is the one marking
-- delivery. A trigger is the right home — it runs in the same transaction as
-- the status change, cannot be skipped by a client, and needs no extra grant.
create or replace function public.sync_prescription_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    update public."Prescription"
       set status = 'fulfilled'
     where id = new."prescriptionId";
  end if;
  return new;
end
$$;

drop trigger if exists pharmacy_order_status_sync on public."PharmacyOrder";
create trigger pharmacy_order_status_sync
  after update on public."PharmacyOrder"
  for each row execute function public.sync_prescription_status();
