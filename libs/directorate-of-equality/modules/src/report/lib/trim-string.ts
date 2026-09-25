import { Transform } from 'class-transformer'

/**
 * Trims a string before validation, so `minLength: 1` means "has text" rather
 * than "has a character". Without it `"   "` passes as a required explanation
 * and lands in front of a reviewer as a blank. Non-strings pass through for the
 * type check to refuse.
 */
export const TrimString = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
