/**
 * The one message in this module with no template of its own: an admin writing
 * to a company in their own words. The subject and body arrive already written,
 * so the module's job is only to make them safe to send.
 *
 * Adds no wrapper, header, footer or branding, deliberately — no message this
 * service sends has one, and a custom mail dressed differently from the approval
 * and denial notices would read as coming from somewhere else.
 */

const BLOCK_BREAK = /<\/(?:p|div|h[1-6]|li|tr|blockquote)\s*>/gi
const LINE_BREAK = /<br\s*\/?>/gi
const ANY_TAG = /<[^>]*>/g

/**
 * Named entities `sanitize-html` emits, plus the numeric forms. This decodes the
 * output of one known sanitizer rather than arbitrary markup, so the five
 * `escapeHtml` produces plus `&nbsp;` is the whole set in practice.
 */
const NAMED_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
}

const decodeEntities = (value: string): string =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16)),
    )
    // Ampersand last, so a `&amp;lt;` in the source decodes to the literal
    // `&lt;` rather than being decoded twice into `<`.
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => NAMED_ENTITIES[m] ?? m)

/**
 * A plain-text alternative derived from the HTML body.
 *
 * A `multipart/alternative` with only an HTML part scores worse with spam
 * filters, and this mail can go out to the whole register at once. Derived
 * rather than asked for, so the two bodies cannot end up saying different
 * things.
 */
export const buildCustomEmailText = (bodyHtml: string): string =>
  decodeEntities(
    bodyHtml
      .replace(BLOCK_BREAK, '\n\n')
      .replace(LINE_BREAK, '\n')
      .replace(ANY_TAG, ''),
  )
    // Collapse the runs the block substitutions leave behind, then trim — a body
    // starting with a heading otherwise opens on blank lines.
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/**
 * The body as sent.
 *
 * Sanitising happens once, at the service boundary, before the body is stored —
 * so the preview, the delivered mail and the timeline read-back are the same
 * bytes. See `CompanyEmailService`.
 */
export const buildCustomEmailHtml = (sanitizedBodyHtml: string): string =>
  sanitizedBodyHtml
