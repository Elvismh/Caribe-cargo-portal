/**
 * "Notas de actualización" is a free-text richText field written by the
 * safety team. In practice it contains Airtable mention links like
 * "[@Ruben Martinez](https://airtable.com/appXXX/...)" that embed internal
 * Airtable base/view/user/record IDs. Those links must never reach the
 * public portal — this strips the link target and keeps just the mentioned
 * name as plain text, and removes any other raw Airtable URL outright.
 *
 * This does NOT redact names typed directly in the note body (e.g. "se
 * entregó a Juan Pérez") — only the embedded link syntax and URLs.
 */
export function sanitizeNotes(raw: string): string {
  return raw
    .replace(/\[([^\]]*)\]\(https?:\/\/[^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\\([.\-_*[\]()])/g, "$1")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
