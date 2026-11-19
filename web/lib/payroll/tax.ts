// PAYG withholding for a pay, from the ATO's Schedule 1 (NAT 1004) and Schedule 8 (NAT 3539) formulas
// for payments made 1 July 2026 to 30 June 2027. Weekly formula y = a*x - b, where x is the weekly
// earnings with cents dropped plus 99 cents, and y is rounded to the nearest dollar.
// Working holiday makers use Schedule 15's flat 15% (up to $45,000 a year).

type Band = [lessThan: number, a: number, b: number];

const SCALE_1: Band[] = [ // tax-free threshold not claimed
  [188, 0.15, 0.15], [371, 0.2084, 11.0185], [515, 0.179, 0.1066], [932, 0.3227, 74.1674],
  [2246, 0.32, 71.6508], [3303, 0.39, 228.8816], [Infinity, 0.47, 493.1893],
];
const SCALE_2: Band[] = [ // tax-free threshold claimed
  [362, 0, 0], [538, 0.15, 54.3462], [673, 0.25, 108.2135], [721, 0.17, 54.3473], [865, 0.179, 60.8377],
  [1282, 0.3227, 185.1935], [2596, 0.32, 181.7319], [3653, 0.39, 363.4627], [Infinity, 0.47, 655.7704],
];
const SCALE_3: Band[] = [ // foreign residents
  [2596, 0.3, 0.3], [3653, 0.37, 181.7308], [Infinity, 0.45, 474.0385],
];
const STSL_THRESHOLD: Band[] = [ // study and training support loans, threshold claimed or foreign resident
  [1337, 0, 0], [2494, 0.15, 200.5615], [3577, 0.17, 250.4527], [Infinity, 0.1, 0],
];
const STSL_NO_THRESHOLD: Band[] = [
  [987, 0, 0], [2144, 0.15, 148.0615], [2727, 0.17, 190.9527], [Infinity, 0.1, 0],
];

export type TaxProfile = { kind: "resident" | "foreign" | "whm" | "no_tfn"; threshold: boolean; studyLoan: boolean };

const formula = (bands: Band[], x: number) => {
  const [, a, b] = bands.find(([lt]) => x < lt)!;
  return Math.max(0, Math.round(a * x - b));
};

/** Tax to withhold from one week's earnings. */
export function weeklyTax(gross: number, p: TaxProfile): number {
  if (gross <= 0) return 0;
  if (p.kind === "no_tfn") return Math.floor(Math.floor(gross) * 0.47);
  if (p.kind === "whm") return Math.round(gross * 0.15);
  const x = Math.floor(gross) + 0.99;
  const base = formula(p.kind === "foreign" ? SCALE_3 : p.threshold ? SCALE_2 : SCALE_1, x);
  const stsl = p.studyLoan ? formula(p.kind === "foreign" || p.threshold ? STSL_THRESHOLD : STSL_NO_THRESHOLD, x) : 0;
  return base + stsl;
}

/** Tax for a pay covering some number of days: worked out per week and multiplied, as the ATO does for fortnights. */
export function periodTax(gross: number, days: number, p: TaxProfile): number {
  const weeks = Math.max(1, Math.round(days / 7));
  return weeklyTax(gross / weeks, p) * weeks;
}

/** Reads the TFN declaration's residency answer. */
export function residencyKind(residency: string | null, tfn: string | null): TaxProfile["kind"] {
  if (!tfn || !tfn.replace(/\D/g, "")) return "no_tfn";
  const r = (residency ?? "").toLowerCase();
  if (r.includes("holiday")) return "whm";
  if (r.includes("foreign")) return "foreign";
  return "resident";
}

/** When the declaration doesn't say, whether a past pay's tax looks like the tax-free threshold was claimed. */
export function thresholdFromPast(gross: number, tax: number, days: number, studyLoan: boolean): boolean {
  const withT = periodTax(gross, days, { kind: "resident", threshold: true, studyLoan });
  const without = periodTax(gross, days, { kind: "resident", threshold: false, studyLoan });
  return Math.abs(tax - withT) <= Math.abs(tax - without);
}

export const SUPER_RATE = 0.12;
