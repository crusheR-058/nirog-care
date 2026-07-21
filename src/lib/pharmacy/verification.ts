/**
 * Pharmacy verification mode.
 *
 * A verified pharmacy can read real prescriptions and patient delivery details,
 * so in production `verified` must only be set by a human who has checked the
 * drug licence against the issuing authority.
 *
 * While Nirog is a demo there is no reviewer, and an unverified pharmacy hits a
 * dead end: it completes onboarding and then waits forever for an approval that
 * nothing can grant. Auto-verify keeps the product walkable end to end.
 *
 * Turn it off with NIROG_PHARMACY_AUTO_VERIFY=false — that single variable is
 * the switch to flip before this platform touches real patients.
 */
export function pharmacyAutoVerify(): boolean {
  return process.env.NIROG_PHARMACY_AUTO_VERIFY !== "false";
}
