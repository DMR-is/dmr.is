/**
 * The codes a filed company snapshot leads with.
 *
 * `isatCategory` and `postcode` are free text on the snapshot: filers send
 * `62010`, `62.01.0`, `62.01`, `J62.01` and `62.01.0 Hugbúnaðargerð` for the
 * same ÍSAT class, and `101` or `101 Reykjavík` for a postcode. These read the
 * code off the front, so a check can refuse a code that does not exist without
 * refusing any of the ways a real one is written.
 */

/**
 * The ÍSAT digits `value` leads with, dots removed (`62.01.0` → `62010`,
 * `62.01` → `6201`), or null when it leads with none. An optional section
 * letter before the digits is skipped.
 */
export const leadingIsatDigits = (value: string): string | null => {
  const match = /^\s*[A-Za-z]?\s*(\d{2}(?:\.?\d){0,3})(?![.\d])/.exec(value)
  return match ? match[1].replace(/\./g, '') : null
}

/** The three-digit postcode `value` leads with, or null. */
export const leadingPostcode = (value: string): string | null => {
  const match = /^\s*(\d{3})(?!\d)/.exec(value)
  return match ? match[1] : null
}
