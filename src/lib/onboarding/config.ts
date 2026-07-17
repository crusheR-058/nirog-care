/**
 * Country-aware onboarding config. The same wizard adapts its identity,
 * medical-registration and payout fields to the selected country — India shows
 * PAN / Aadhaar / SMC-DMC / IFSC; other countries show their equivalents.
 */
export interface CountryConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  taxIdLabel: string; // PAN, SSN, NINO, Tax ID…
  idProofOptions: string[];
  councilLabel: string; // medical registration authority
  councilPlaceholder: string;
  bankRoutingLabel: string; // IFSC, Routing, Sort code, SWIFT…
  requiresIban: boolean;
  pincodeLabel: string;
  stateLabel: string;
}

const INTERNATIONAL_DEFAULT: Omit<CountryConfig, "code" | "name" | "currency" | "currencySymbol" | "phoneCode"> = {
  taxIdLabel: "Tax ID",
  idProofOptions: ["Passport", "National ID", "Driver's license"],
  councilLabel: "Medical council / board",
  councilPlaceholder: "Registration / license number",
  bankRoutingLabel: "SWIFT / BIC",
  requiresIban: true,
  pincodeLabel: "Postal code",
  stateLabel: "State / Province",
};

export const COUNTRIES: CountryConfig[] = [
  {
    code: "IN", name: "India", currency: "INR", currencySymbol: "₹", phoneCode: "+91",
    taxIdLabel: "PAN", idProofOptions: ["Aadhaar", "Passport", "Voter ID", "Driving licence"],
    councilLabel: "SMC / DMC / RCI / IDA / IAP registration", councilPlaceholder: "State medical council reg. no.",
    bankRoutingLabel: "IFSC code", requiresIban: false, pincodeLabel: "Pincode", stateLabel: "State",
  },
  {
    code: "US", name: "United States", currency: "USD", currencySymbol: "$", phoneCode: "+1",
    taxIdLabel: "SSN / EIN", idProofOptions: ["Passport", "Driver's license", "State ID"],
    councilLabel: "State medical board (NPI)", councilPlaceholder: "NPI / state license number",
    bankRoutingLabel: "Routing number (ABA)", requiresIban: false, pincodeLabel: "ZIP code", stateLabel: "State",
  },
  {
    code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", phoneCode: "+44",
    taxIdLabel: "National Insurance No", idProofOptions: ["Passport", "Driving licence", "BRP"],
    councilLabel: "GMC reference", councilPlaceholder: "GMC reference number",
    bankRoutingLabel: "Sort code", requiresIban: true, pincodeLabel: "Postcode", stateLabel: "County",
  },
  {
    code: "AE", name: "United Arab Emirates", currency: "AED", currencySymbol: "د.إ", phoneCode: "+971",
    taxIdLabel: "Emirates ID", idProofOptions: ["Emirates ID", "Passport"],
    councilLabel: "DHA / MOH / DoH license", councilPlaceholder: "Health authority license no.",
    bankRoutingLabel: "SWIFT / BIC", requiresIban: true, pincodeLabel: "PO Box", stateLabel: "Emirate",
  },
  {
    code: "AU", name: "Australia", currency: "AUD", currencySymbol: "$", phoneCode: "+61",
    taxIdLabel: "TFN", idProofOptions: ["Passport", "Driver's licence", "Medicare card"],
    councilLabel: "AHPRA registration", councilPlaceholder: "AHPRA registration number",
    bankRoutingLabel: "BSB", requiresIban: false, pincodeLabel: "Postcode", stateLabel: "State",
  },
  {
    code: "SG", name: "Singapore", currency: "SGD", currencySymbol: "$", phoneCode: "+65",
    taxIdLabel: "NRIC / FIN", idProofOptions: ["NRIC", "Passport", "FIN"],
    councilLabel: "SMC registration", councilPlaceholder: "SMC registration number",
    bankRoutingLabel: "Bank + branch code", requiresIban: false, pincodeLabel: "Postal code", stateLabel: "Region",
  },
  {
    code: "CA", name: "Canada", currency: "CAD", currencySymbol: "$", phoneCode: "+1",
    taxIdLabel: "SIN", idProofOptions: ["Passport", "Driver's licence", "Health card"],
    councilLabel: "Provincial college (CPSO…)", councilPlaceholder: "College registration number",
    bankRoutingLabel: "Transit + institution no.", requiresIban: false, pincodeLabel: "Postal code", stateLabel: "Province",
  },
  {
    code: "OTHER", name: "Other (international)", currency: "USD", currencySymbol: "$", phoneCode: "+",
    ...INTERNATIONAL_DEFAULT,
  },
];

export function countryByCode(code: string): CountryConfig {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[COUNTRIES.length - 1];
}

export function countryByName(name?: string): CountryConfig {
  return COUNTRIES.find((c) => c.name === name) ?? COUNTRIES[0];
}

/** Indian languages from the reference form + major world languages. */
export const LANGUAGES = [
  "English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati",
  "Kannada", "Malayalam", "Odia", "Punjabi", "Assamese", "Urdu", "Sanskrit",
  "Konkani", "Manipuri", "Nepali", "Bodo", "Dogri", "Kashmiri", "Maithili",
  "Santhali", "Sindhi",
  "Spanish", "French", "Arabic", "Mandarin", "Portuguese", "Russian",
  "German", "Japanese", "Swahili", "Bahasa",
];

export const SPECIALTIES = [
  "General Physician", "Family Medicine", "Internal Medicine", "Cardiology",
  "Dermatology", "Pediatrics", "Gynecology & Obstetrics", "Orthopedics",
  "Neurology", "Psychiatry", "ENT", "Ophthalmology", "Dentistry",
  "Gastroenterology", "Pulmonology", "Endocrinology", "Nephrology",
  "Urology", "Oncology", "Rheumatology", "Anesthesiology", "Radiology",
  "General Surgery", "Plastic Surgery", "Ayurveda", "Homeopathy",
  "Physiotherapy", "Nutrition & Dietetics",
];

export const WEEKDAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export const CERTIFICATES: { key: string; label: string; required: boolean }[] = [
  { key: "undergraduate", label: "Undergraduate (MBBS / BDS / BPT)", required: true },
  { key: "postgraduate", label: "Post Graduate (MD / MS / MDS)", required: false },
  { key: "diploma", label: "Diploma", required: false },
  { key: "dnb", label: "DNB (Diplomate of National Board)", required: false },
  { key: "superSpecialty", label: "Super-specialty (DM / MCh)", required: false },
  { key: "fellowship", label: "Fellowship", required: false },
];
