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

## Verification (demo mode)

`Pharmacy.verified` gates both the console and every prescription-related RLS
policy. There is no reviewer yet, so an unverified pharmacy would complete
onboarding and then wait forever for an approval nothing could grant.

**Auto-verify is therefore ON**: submitting the onboarding wizard approves the
pharmacy immediately and opens its console. The wizard, the submit button and
the status page all say so — the product should never claim a licence review
that isn't happening.

Turn it off with a single variable before this platform touches real patients:

```
NIROG_PHARMACY_AUTO_VERIFY=false
```

With it off, `verified` stays false until a human sets it, and the status page
reverts to "verification in review". See
[`src/lib/pharmacy/verification.ts`](../src/lib/pharmacy/verification.ts).

Required licence and pharmacist-certificate uploads are still enforced, and the
files are stored — they are exactly what a reviewer will inspect once manual
verification is switched back on.

### Routing keys

`district` is what the order pool matches on, and the wizard only makes *city*
mandatory — so a pharmacy could be verified yet serve nowhere. Onboarding
back-fills `district` from `city` when it is blank.

Matching is also deliberately loose: patient districts are seeded fully
qualified ("Barabanki, UP") while pharmacies type what they call their area
("Barabanki"). `pharmacy_serves()` matches when either side contains the other,
falling back to state, so a correctly-registered pharmacy next door to a patient
cannot silently miss the order.

### Still manual

An admin review queue — so a human can approve, reject and re-verify pharmacies
without a SQL console — is the obvious next piece of work.
