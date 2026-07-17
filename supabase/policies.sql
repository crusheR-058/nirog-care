-- Nirog Supabase policies — apply with: supabase db execute, or psql $DIRECT_URL -f this file.
-- (Also applied to project vjiklmgyaqqnvwpiqhow via the Management API.)

-- ── Nirog RLS: the database enforces per-doctor + per-consent access ──

-- Map the current Supabase auth user → their Doctor.id (bypasses RLS internally).
create or replace function public.current_doctor_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public."Doctor" where "authUserId" = auth.uid()
$$;

-- A patient is accessible to the current doctor if they have an active consent
-- grant to that doctor OR the patient is in that doctor's queue.
create or replace function public.patient_accessible(pid text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public."ConsentGrant" c
    where c."patientId" = pid and c."grantedTo" = public.current_doctor_id() and c.active
  ) or exists (
    select 1 from public."QueueEntry" q
    where q."patientId" = pid and q."doctorId" = public.current_doctor_id()
  )
$$;

-- Enable RLS on every table. With only `to authenticated` policies below, the
-- anon role (public Supabase API) gets nothing; the service role bypasses RLS.
alter table public."Doctor"       enable row level security;
alter table public."Patient"      enable row level security;
alter table public."AriaHandover" enable row level security;
alter table public."QueueEntry"   enable row level security;
alter table public."Encounter"    enable row level security;
alter table public."ConsentGrant" enable row level security;
alter table public."AuditEvent"   enable row level security;
alter table public."Account"      enable row level security;

-- Doctor: can read only their own profile.
drop policy if exists doctor_select_self on public."Doctor";
create policy doctor_select_self on public."Doctor" for select to authenticated
  using ("authUserId" = auth.uid());

-- Patient: readable only if accessible to the current doctor.
drop policy if exists patient_select_accessible on public."Patient";
create policy patient_select_accessible on public."Patient" for select to authenticated
  using (public.patient_accessible(id));

-- ARIA handover: follows patient accessibility; doctor may mark it verified.
drop policy if exists handover_select on public."AriaHandover";
create policy handover_select on public."AriaHandover" for select to authenticated
  using (public.patient_accessible("patientId"));
drop policy if exists handover_update on public."AriaHandover";
create policy handover_update on public."AriaHandover" for update to authenticated
  using (public.patient_accessible("patientId"))
  with check (public.patient_accessible("patientId"));

-- Queue: a doctor sees and updates only their own queue.
drop policy if exists queue_select_own on public."QueueEntry";
create policy queue_select_own on public."QueueEntry" for select to authenticated
  using ("doctorId" = public.current_doctor_id());
drop policy if exists queue_update_own on public."QueueEntry";
create policy queue_update_own on public."QueueEntry" for update to authenticated
  using ("doctorId" = public.current_doctor_id())
  with check ("doctorId" = public.current_doctor_id());

-- Encounters: readable if the doctor authored them or the patient is accessible;
-- insertable only for the current doctor on an accessible patient.
drop policy if exists encounter_select on public."Encounter";
create policy encounter_select on public."Encounter" for select to authenticated
  using ("doctorId" = public.current_doctor_id() or public.patient_accessible("patientId"));
drop policy if exists encounter_insert on public."Encounter";
create policy encounter_insert on public."Encounter" for insert to authenticated
  with check ("doctorId" = public.current_doctor_id() and public.patient_accessible("patientId"));

-- Consent grants: a doctor sees only grants made to them.
drop policy if exists consent_select_own on public."ConsentGrant";
create policy consent_select_own on public."ConsentGrant" for select to authenticated
  using ("grantedTo" = public.current_doctor_id());

-- Audit: a doctor sees and appends only their own events (append-only).
drop policy if exists audit_select_own on public."AuditEvent";
create policy audit_select_own on public."AuditEvent" for select to authenticated
  using ("actorId" = public.current_doctor_id());
drop policy if exists audit_insert_own on public."AuditEvent";
create policy audit_insert_own on public."AuditEvent" for insert to authenticated
  with check ("actorId" = public.current_doctor_id());

-- Account: internal identity table — no policies, so no client access at all.

-- ── Storage ──
-- Storage RLS: a doctor can access files only for patients they can access.
-- Path convention: patient-documents/<patientId>/<filename>
-- storage.objects already has RLS enabled by Supabase; we add policies.

drop policy if exists nirog_docs_select on storage.objects;
create policy nirog_docs_select on storage.objects for select to authenticated
  using (
    bucket_id = 'patient-documents'
    and public.patient_accessible((storage.foldername(name))[1])
  );

drop policy if exists nirog_docs_insert on storage.objects;
create policy nirog_docs_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'patient-documents'
    and public.patient_accessible((storage.foldername(name))[1])
  );

drop policy if exists nirog_docs_delete on storage.objects;
create policy nirog_docs_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'patient-documents'
    and public.patient_accessible((storage.foldername(name))[1])
  );
