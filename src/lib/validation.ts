const CODE_PATTERN = /^[A-Z]{2,4}-\d{12}$/;

/**
 * Report codes are of the form STATION-DDMMYYYYHHMM (e.g. PUJ-020820251835).
 * This is also the primary line of defense against Airtable formula injection:
 * anything that doesn't match this closed character set is rejected before
 * ever being used to build a query.
 */
export function parseReportCode(raw: string): string | null {
  const candidate = raw.trim().toUpperCase();
  return CODE_PATTERN.test(candidate) ? candidate : null;
}
