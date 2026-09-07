/**
 * ⚠️ **`filename="…"` is not percent-decoded by browsers.** It is defined as
 * ISO-8859-1, so `encodeURIComponent` inside it is what the save dialog
 * literally shows — `jafnréttisáætlun.pdf` offers itself as
 * `jafnr%C3%A9ttis%C3%A1%C3%A6tlun.pdf`. RFC 5987's
 * `filename*=UTF-8''<pct-encoded>` is the parameter that IS decoded, and it
 * wins wherever both are present, so the plain `filename=` stays behind it as
 * an ASCII-folded fallback for anything that ignores the extended form.
 *
 * Kept as one helper because the name is applicant-supplied and both halves
 * have to be escaped for the position they sit in — a per-controller string
 * template is exactly how one of them ends up unescaped.
 */

/**
 * Percent-encodes for RFC 5987 `ext-value`.
 *
 * `encodeURIComponent` alone is not enough: it leaves `'`, `(`, `)` and `*`
 * literal, and none of them are `attr-char`. Browsers tolerate them, parsers
 * are not required to.
 */
const encodeExtValue = (value: string): string =>
  encodeURIComponent(value).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  )

/**
 * Folds a filename down to something safe inside a quoted ASCII parameter.
 *
 * The first pass drops everything outside printable ASCII — which is what
 * keeps a CR/LF in an uploaded filename from splitting the header — and the
 * second removes the two characters that would otherwise close the quoted
 * string early.
 */
const toAsciiFallback = (fileName: string): string => {
  const folded = fileName
    .replace(/[^\x20-\x7e]/g, '_')
    .replace(/["\\]/g, '_')
    .trim()

  return folded.length > 0 ? folded : 'document'
}

export function contentDisposition(
  type: 'inline' | 'attachment',
  fileName: string,
): string {
  const fallback = toAsciiFallback(fileName)
  const extended = encodeExtValue(fileName)

  // An empty `filename*=UTF-8''` is worse than no extended parameter at all,
  // and a blank name is only reachable if a caller skips the validation in
  // `resolveEqualityContent` — so degrade rather than emit it.
  if (extended.length === 0) {
    return `${type}; filename="${fallback}"`
  }

  return `${type}; filename="${fallback}"; filename*=UTF-8''${extended}`
}
