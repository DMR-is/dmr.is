/**
 * The one message in this module with no template of its own.
 *
 * Every other outbound mail here is generated — the Directorate decided
 * something and the body says what. This one is an admin writing to a company in
 * their own words, so there is nothing to compose: the subject and the body
 * arrive already written, and the module's job shrinks to making them safe to
 * send.
 *
 * ⚠️ Deliberately adds **no** wrapper, header, footer or branding. Not an
 * oversight and not a gap to fill later: no message this service sends has one,
 * and a custom mail that arrived dressed differently from the approval and
 * denial notices would read as coming from somewhere else.
 */

const BLOCK_BREAK = /<\/(?:p|div|h[1-6]|li|tr|blockquote)\s*>/gi
const LINE_BREAK = /<br\s*\/?>/gi
const ANY_TAG = /<[^>]*>/g

/**
 * Named entities `sanitize-html` emits, plus the numeric forms. Not a general
 * HTML entity table — this decodes the output of one known sanitizer, not
 * arbitrary markup, so the five `escapeHtml` produces plus `&nbsp;` is the
 * whole set in practice.
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
    // Ampersand last among the named entities, so a `&amp;lt;` in the source
    // decodes to the literal `&lt;` rather than being decoded twice into `<`.
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39);/g, (m) => NAMED_ENTITIES[m] ?? m)

/**
 * A plain-text alternative derived from the HTML body.
 *
 * Every other message here sends `text` alongside `html`, and this one must too:
 * a `multipart/alternative` with only an HTML part scores worse with spam
 * filters, and this mail goes out to up to the whole register at once — exactly
 * the volume where a deliverability penalty is expensive.
 *
 * Derived rather than asked for, because the admin wrote one body and asking for
 * a second is how the two end up saying different things.
 */
export const buildCustomEmailText = (bodyHtml: string): string =>
  decodeEntities(
    bodyHtml
      .replace(BLOCK_BREAK, '\n\n')
      .replace(LINE_BREAK, '\n')
      .replace(ANY_TAG, ''),
  )
    // Collapse the runs the block/line substitutions leave behind, then trim —
    // a body that starts with a heading otherwise opens on blank lines.
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

/**
 * The body as sent.
 *
 * ⚠️ Sanitising is **not** done here — it happens once, at the service boundary,
 * before the body is stored. That ordering is the point: what the admin previews,
 * what is sent, and what the timeline reads back later are then the same bytes,
 * rather than three passes that could disagree. See `CompanyEmailService`.
 */
export const buildCustomEmailHtml = (sanitizedBodyHtml: string): string =>
  sanitizedBodyHtml
