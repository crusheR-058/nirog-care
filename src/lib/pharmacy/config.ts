/**
 * Country-aware pharmacy onboarding config — the pharmacy counterpart to
 * src/lib/onboarding/config.ts. The same wizard adapts its licence, tax and
 * payout fields to the selected country: India shows Drug Licence (Form 20/21),
 * GSTIN and State Pharmacy Council; the US shows a Board of Pharmacy licence,
 * DEA and EIN; and so on.
 */
export interface PharmacyCountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  /** The premises/trading licence that legally permits dispensing. */
  licenseLabel: string;
  licensePlaceholder: string;
  /** The registered pharmacist's personal registration. */
  pharmacistLabel: string;
  pharmacistPlaceholder: string;
  /** Sales-tax / business registration (GSTIN, EIN, VAT…). */
  taxRegLabel: string;
  /** Personal/business tax id (PAN, SSN…). */
  taxIdLabel: string;
  /** Controlled-substances authorisation, where applicable. */
  controlledLabel?: string;
  idProofOptions: string[];
  bankRoutingLabel: string;
  requiresIban: boolean;
  pincodeLabel: string;
  stateLabel: string;
}

const INTERNATIONAL_DEFAULT: Omit<
  PharmacyCountryConfig,
  "code" | "name" | "currency" | "currencySymbol" | "phoneCode"
> = {
  licenseLabel: "Pharmacy / premises licence",
  licensePlaceholder: "Licence number",
  pharmacistLabel: "Pharmacist registration",
  pharmacistPlaceholder: "Registration / licence number",
  taxRegLabel: "Business tax registration",
  taxIdLabel: "Tax ID",
  idProofOptions: ["Passport", "National ID", "Driver's license"],
  bankRoutingLabel: "SWIFT / BIC",
  requiresIban: true,
  pincodeLabel: "Postal code",
  stateLabel: "State / Province",
};

export const PHARMACY_COUNTRIES: PharmacyCountryConfig[] = [
  {
    code: "IN", name: "India", currency: "INR", currencySymbol: "₹", phoneCode: "+91",
    licenseLabel: "Drug licence (Form 20 / 21)", licensePlaceholder: "e.g. 20B/UP/2024/12345",
    pharmacistLabel: "State Pharmacy Council registration", pharmacistPlaceholder: "Registered pharmacist reg. no.",
    taxRegLabel: "GSTIN", taxIdLabel: "PAN", controlledLabel: "NDPS licence (if stocked)",
    idProofOptions: ["Aadhaar", "Passport", "Voter ID", "Driving licence"],
    bankRoutingLabel: "IFSC code", requiresIban: false, pincodeLabel: "Pincode", stateLabel: "State",
  },
  {
    code: "US", name: "United States", currency: "USD", currencySymbol: "$", phoneCode: "+1",
    licenseLabel: "State Board of Pharmacy licence", licensePlaceholder: "Pharmacy licence number",
    pharmacistLabel: "Pharmacist-in-charge (RPh) licence", pharmacistPlaceholder: "RPh licence number",
    taxRegLabel: "EIN", taxIdLabel: "SSN / EIN", controlledLabel: "DEA registration",
    idProofOptions: ["Passport", "Driver's license", "State ID"],
    bankRoutingLabel: "Routing number (ABA)", requiresIban: false, pincodeLabel: "ZIP code", stateLabel: "State",
  },
  {
    code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", phoneCode: "+44",
    licenseLabel: "GPhC premises registration", licensePlaceholder: "Premises registration number",
    pharmacistLabel: "GPhC pharmacist registration", pharmacistPlaceholder: "GPhC number",
    taxRegLabel: "VAT number", taxIdLabel: "National Insurance No", controlledLabel: "Controlled drugs licence",
    idProofOptions: ["Passport", "Driving licence", "BRP"],
    bankRoutingLabel: "Sort code", requiresIban: true, pincodeLabel: "Postcode", stateLabel: "County",
  },
  {
    code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", phoneCode: "+971",
    licenseLabel: "DHA / MOH pharmacy licence", licensePlaceholder: "Health authority licence no.",
    pharmacistLabel: "Pharmacist licence", pharmacistPlaceholder: "DHA / MOH pharmacist licence",
    taxRegLabel: "TRN (VAT)", taxIdLabel: "Emirates ID",
    idProofOptions: ["Emirates ID", "Passport"],
    bankRoutingLabel: "SWIFT / BIC", requiresIban: true, pincodeLabel: "PO Box", stateLabel: "Emirate",
  },
  {
    code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", phoneCode: "+61",
    licenseLabel: "State pharmacy premises licence", licensePlaceholder: "Premises licence number",
    pharmacistLabel: "AHPRA pharmacist registration", pharmacistPlaceholder: "AHPRA registration number",
    taxRegLabel: "ABN", taxIdLabel: "TFN",
    idProofOptions: ["Passport", "Driver's licence", "Medicare card"],
    bankRoutingLabel: "BSB", requiresIban: false, pincodeLabel: "Postcode", stateLabel: "State",
  },
  {
    code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", phoneCode: "+65",
    licenseLabel: "HSA retail pharmacy licence", licensePlaceholder: "HSA licence number",
    pharmacistLabel: "SPC pharmacist registration", pharmacistPlaceholder: "SPC registration number",
    taxRegLabel: "GST registration", taxIdLabel: "NRIC / FIN",
    idProofOptions: ["NRIC", "Passport", "FIN"],
    bankRoutingLabel: "Bank + branch code", requiresIban: false, pincodeLabel: "Postal code", stateLabel: "Region",
  },
  {
    code: "OTHER", name: "Other (international)", currency: "USD", currencySymbol: "$", phoneCode: "+",
    ...INTERNATIONAL_DEFAULT,
  },
];

export function pharmacyCountryByCode(code: string): PharmacyCountryConfig {
  return (
    PHARMACY_COUNTRIES.find((c) => c.code === code) ??
    PHARMACY_COUNTRIES[PHARMACY_COUNTRIES.length - 1]
  );
}

/** Services a partner pharmacy can offer through the care loop. */
export const PHARMACY_SERVICES = [
  "Home delivery",
  "24×7 counter",
  "Cold-chain storage",
  "Generic substitution",
  "OTC & wellness",
  "AYUSH / Ayurveda",
  "Surgical & consumables",
  "Diagnostics sample pickup",
  "Medical equipment rental",
  "Vaccination stock",
];

export const PHARMACY_TYPES = [
  "Retail pharmacy",
  "Hospital pharmacy",
  "Chain outlet",
  "Wholesale / distributor",
  "Online-only pharmacy",
];

export const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

/** Verification documents. `required` gates submission. */
export const PHARMACY_DOCS: { key: string; label: string; required: boolean }[] = [
  { key: "drugLicense", label: "Drug licence (Form 20 / 21 or local equivalent)", required: true },
  { key: "pharmacistCert", label: "Registered pharmacist certificate", required: true },
  { key: "taxRegistration", label: "GST / VAT / tax registration", required: false },
  { key: "premisesPhoto", label: "Storefront / premises photo", required: false },
  { key: "idProof", label: "Owner ID proof", required: false },
  { key: "cancelledCheque", label: "Cancelled cheque / bank proof", required: false },
];

/** The onboarding payload persisted to Pharmacy.profile (JSON). */
export interface PharmacyProfile {
  // Business
  name: string;
  ownerName: string;
  pharmacyType: string;
  yearsOperating?: number;
  country: string;
  currency?: string;
  // Contact
  email?: string;
  phone: string;
  altPhone?: string;
  // Location
  street?: string;
  address?: string;
  city: string;
  district?: string;
  state?: string;
  pincode?: string;
  deliveryRadiusKm?: number;
  // Licensing
  licenseNo: string;
  licenseExpiry?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
  taxRegNo?: string;
  taxIdNo?: string;
  controlledNo?: string;
  // Operations
  services: string[];
  weekdays: string[];
  openFrom?: string;
  openTo?: string;
  // Payout
  bankAccountName?: string;
  bankAccountNo?: string;
  bankRouting?: string;
  iban?: string;
  // Documents (storage paths)
  documents: Record<string, string | undefined>;
  // Labels captured at submit time, so the record reads correctly later.
  licenseLabel?: string;
  pharmacistLabel?: string;
  taxRegLabel?: string;
  bankRoutingLabel?: string;
}
