/**
 * Operator details for the legal pages (Impressum / privacy policy).
 *
 * They are read from build-time environment variables so that no personal data
 * is hardcoded in the repository. Self-hosters set their own values; when a
 * value is missing, the pages show an explicit "not configured" notice instead
 * of somebody else's details.
 */

export type Operator = {
  /** Business or project name shown as the operator. */
  name: string;
  /** Natural person legally representing the operator. */
  representative: string | null;
  /** Postal address lines (street, postcode and city, country). */
  address: string[];
  /** Contact email address. */
  email: string | null;
  /** Short location shown in the footer, e.g. "Example City, Germany". */
  location: string | null;
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveOperator(env: Record<string, string | undefined>): Operator {
  return {
    name: clean(env.NEXT_PUBLIC_OPERATOR_NAME) ?? "Operator not configured",
    representative: clean(env.NEXT_PUBLIC_OPERATOR_REPRESENTATIVE),
    address: (clean(env.NEXT_PUBLIC_OPERATOR_ADDRESS) ?? "")
      .split("|")
      .map((line) => line.trim())
      .filter(Boolean),
    email: clean(env.NEXT_PUBLIC_OPERATOR_EMAIL),
    location: clean(env.NEXT_PUBLIC_OPERATOR_LOCATION)
  };
}

/* Next.js inlines NEXT_PUBLIC_* only for direct property access, so the
 * variables are listed explicitly here. */
export const operator: Operator = resolveOperator({
  NEXT_PUBLIC_OPERATOR_NAME: process.env.NEXT_PUBLIC_OPERATOR_NAME,
  NEXT_PUBLIC_OPERATOR_REPRESENTATIVE: process.env.NEXT_PUBLIC_OPERATOR_REPRESENTATIVE,
  NEXT_PUBLIC_OPERATOR_ADDRESS: process.env.NEXT_PUBLIC_OPERATOR_ADDRESS,
  NEXT_PUBLIC_OPERATOR_EMAIL: process.env.NEXT_PUBLIC_OPERATOR_EMAIL,
  NEXT_PUBLIC_OPERATOR_LOCATION: process.env.NEXT_PUBLIC_OPERATOR_LOCATION
});
