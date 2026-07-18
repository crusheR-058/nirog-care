-- Nirog — patient-app access layer (companion to policies.sql).
-- Adds the patient/Account side so the Expo app can authenticate against the
-- SAME Supabase project and create consult requests. All policies are
-- ADDITIVE and permissive: patient policies key on current_account_id(),
-- doctor policies (policies.sql) key on current_doctor_id(); a session is one
-- or the other, so the two never widen each other's access.
-- Apply with: psql $DIRECT_URL -f supabase/patient-access.sql
-- (Also applied to project vjiklmgyaqqnvwpiqhow via the Management API.)

-- Map the current Supabase auth user → their Account.id (patient-app user).
create or replace function public.current_account_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public."Account" where "authUserId" = auth.uid()
$$;

-- Does the current account own this patient profile?
create or replace function public.account_owns_patient(pid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."Patient" p
    where p.id = pid and p."accountId" = public.current_account_id()
  )
$$;

-- First-sign-in bootstrap: link (or create) the Account for the current auth
-- user. A brand-new patient has no Account row and RLS won't let them insert
-- one for an arbitrary id, so this runs SECURITY DEFINER. Idempotent; also
-- adopts a pre-provisioned phone-only Account if one exists.
create or replace function public.ensure_account(p_phone text)
returns text language plpgsql security definer set search_path = public as $$
declare aid text;
begin
  select id into aid from public."Account" where "authUserId" = auth.uid();
  if aid is not null then return aid; end if;

  select id into aid from public."Account"
    where phone = p_phone and "authUserId" is null limit 1;
  if aid is not null then
    update public."Account" set "authUserId" = auth.uid() where id = aid;
    return aid;
  end if;

  aid := replace(gen_random_uuid()::text, '-', '');
  insert into public."Account"(id, phone, "authUserId", "createdAt")
    values (aid, p_phone, auth.uid(), now());
  return aid;
end $$;
grant execute on function public.ensure_account(text) to authenticated;

-- ── Account: the patient can read + update only their own account row
-- (needed for the expo push token; no cross-account visibility). ──
drop policy if exists account_select_self on public."Account";
create policy account_select_self on public."Account" for select to authenticated
  using ("authUserId" = auth.uid());
drop policy if exists account_update_self on public."Account";
create policy account_update_self on public."Account" for update to authenticated
  using ("authUserId" = auth.uid())
  with check ("authUserId" = auth.uid());

-- ── Patient: an account owner manages their own patient profiles ──
drop policy if exists patient_select_own_account on public."Patient";
create policy patient_select_own_account on public."Patient" for select to authenticated
  using ("accountId" = public.current_account_id());
drop policy if exists patient_insert_own_account on public."Patient";
create policy patient_insert_own_account on public."Patient" for insert to authenticated
  with check ("accountId" = public.current_account_id());
drop policy if exists patient_update_own_account on public."Patient";
create policy patient_update_own_account on public."Patient" for update to authenticated
  using ("accountId" = public.current_account_id())
  with check ("accountId" = public.current_account_id());

-- ── ARIA handover: an account writes/reads intake for its own patients ──
drop policy if exists handover_select_own_account on public."AriaHandover";
create policy handover_select_own_account on public."AriaHandover" for select to authenticated
  using (public.account_owns_patient("patientId"));
drop policy if exists handover_insert_own_account on public."AriaHandover";
create policy handover_insert_own_account on public."AriaHandover" for insert to authenticated
  with check (public.account_owns_patient("patientId"));

-- ── QueueEntry: an account CREATES consult requests for its own patients
-- (gap #2) and reads its own patients' queue rows to watch for pick-up. ──
drop policy if exists queue_insert_own_account on public."QueueEntry";
create policy queue_insert_own_account on public."QueueEntry" for insert to authenticated
  with check (public.account_owns_patient("patientId"));
drop policy if exists queue_select_own_account on public."QueueEntry";
create policy queue_select_own_account on public."QueueEntry" for select to authenticated
  using (public.account_owns_patient("patientId"));

-- ── Encounter: an account READS its own patients' care plans / prescriptions ──
drop policy if exists encounter_select_own_account on public."Encounter";
create policy encounter_select_own_account on public."Encounter" for select to authenticated
  using (public.account_owns_patient("patientId"));

-- ── Consent: an account grants / reads / revokes consent for its patients ──
drop policy if exists consent_select_own_account on public."ConsentGrant";
create policy consent_select_own_account on public."ConsentGrant" for select to authenticated
  using (public.account_owns_patient("patientId"));
drop policy if exists consent_insert_own_account on public."ConsentGrant";
create policy consent_insert_own_account on public."ConsentGrant" for insert to authenticated
  with check (public.account_owns_patient("patientId"));
drop policy if exists consent_update_own_account on public."ConsentGrant";
create policy consent_update_own_account on public."ConsentGrant" for update to authenticated
  using (public.account_owns_patient("patientId"))
  with check (public.account_owns_patient("patientId"));

-- ── Doctor pool: any on-call doctor may SEE unassigned waiting requests and
-- CLAIM one atomically. These are ADDITIVE to queue_select_own/queue_update_own.
-- Pre-claim, only QueueEntry fields are visible (triage, reason, channel) —
-- patient PII stays gated by patient_accessible() until the row is claimed. ──
drop policy if exists queue_select_pool on public."QueueEntry";
create policy queue_select_pool on public."QueueEntry" for select to authenticated
  using (
    "doctorId" is null
    and state = 'waiting'
    and public.current_doctor_id() is not null
  );

drop policy if exists queue_claim on public."QueueEntry";
create policy queue_claim on public."QueueEntry" for update to authenticated
  using (
    "doctorId" is null
    and state = 'waiting'
    and public.current_doctor_id() is not null
  )
  with check ("doctorId" = public.current_doctor_id());

-- Let any authenticated doctor read the ARIA handover attached to a POOL
-- request (triage decision), even before claiming — read-only, no patient row.
drop policy if exists handover_select_pool on public."AriaHandover";
create policy handover_select_pool on public."AriaHandover" for select to authenticated
  using (
    public.current_doctor_id() is not null
    and exists (
      select 1 from public."QueueEntry" q
      where q."handoverId" = "AriaHandover".id
        and q."doctorId" is null
        and q.state = 'waiting'
    )
  );
