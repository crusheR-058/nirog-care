# The Fulfil step — prescriptions → partner pharmacies

Closes the last open link in the Nirog care loop. A filed consultation note now
produces a real prescription that reaches a licence-verified pharmacy, which
dispenses and delivers it.

---

## The shape

```
Doctor files the note
  └─ Encounter                                (clinical record — stays private)
       └─ Prescription  + PrescriptionItem[]  (what to dispense, ATC-coded)
            └─ PharmacyOrder                  (pharmacyId = NULL → district pool)
                 ├─ any VERIFIED pharmacy serving that district claims it
                 └─ OrderEvent[]              (append-only fulfilment trail)
```

This is deliberately the **same pool-and-claim pattern as the on-demand doctor
queue**: work is offered to a pool, the first eligible party claims it
atomically, and losing the race is a normal outcome rather than an error.

## Statuses

`routed → accepted → preparing → ready → dispatched → delivered`

Declining returns the order to the pool (`pharmacyId` cleared, back to `routed`)
so another pharmacy in the district can fulfil it — a decline must never be a
dead end for the patient.

Transitions are validated server-side in
[`pharmacy-source.ts`](../src/lib/data/pharmacy-source.ts) against
`ORDER_TRANSITIONS`, so a crafted request cannot jump an order straight to
`delivered`. Marking delivery flips the prescription to `fulfilled` via the
`pharmacy_order_status_sync` trigger — not from the app, because RLS
(correctly) only lets the prescribing doctor update a prescription.

---

## The privacy boundary

**A pharmacy never gains access to `Patient`, `Encounter`, `AriaHandover`,
`QueueEntry` or `Doctor`.** It sees the medication lines it must dispense, plus
a delivery snapshot (name, masked phone, village) denormalised onto the order.

That snapshot is a design decision, not laziness: it means fulfilment needs no
join into the clinical record at all. Widening what a pharmacy can see should
require a new consent scope, not a new join.

Visibility opens in two stages, mirroring the doctor side (triage before accept,
full chart after):

| Stage | The pharmacy can see |
|---|---|
| In the district pool | Medication lines + delivery area — enough to judge stock |
| After claiming | The above, plus contact details for delivery |
| Ever | Nothing clinical — no diagnosis, notes, history or intake |

Enforced in [`supabase/fulfilment.sql`](../supabase/fulfilment.sql) and proven by
the isolation assertions in the E2E run (`tmp/rxflow.mjs`), which sign in as a
real pharmacy and query PostgREST directly — testing the database boundary, not
what the UI chooses to render.

Routing is by **geography, never by patient identity**: the pool is keyed on
district (falling back to state so a district with no partner pharmacy doesn't
strand orders).

---

## The drug catalogue

**5,154 substances** — the complete WHO ATC/DDD index, the global standard for
classifying drug substances, across all 14 anatomical groups.

Reseed with `pnpm db:seed:drugs` ([`prisma/seed-drugs.ts`](../prisma/seed-drugs.ts)),
which is idempotent.

Doctors prescribe through a typeahead that attaches the **ATC code** to the line,
so the pharmacy dispenses against a globally unique identifier instead of parsing
a free-text drug name. Free text is still permitted — a clinician must never be
blocked by a catalogue gap — but a coded line is unambiguous.

Search is ranked in SQL (`search_drugs`), not alphabetically. This matters
clinically: plain ordering put the combination product *"aliskiren and
amlodipine"* above *"amlodipine"* purely because `al` sorts before `am`. Exact
and prefix matches now win, and shorter names break ties so single substances
outrank combinations.

---

## Still manual

**Pharmacy approval.** `Pharmacy.verified` is what unlocks both the console and
every prescription-related RLS policy, and nothing in the product sets it — it
is a `UPDATE` in the Supabase dashboard:

```sql
update "Pharmacy"
   set verified = true, district = 'Barabanki, UP', state = 'UP'
 where email = '<pharmacy email>';
```

`district` matters as much as `verified`: without it the pharmacy is verified but
serves nowhere, so its pool is always empty.

An admin review queue is the obvious next piece of work.
