/**
 * The two scope sets an admin chooses between, for a firm as for a company key.
 * The filing scopes always travel together, so the only real decision is
 * whether the firm may also author a starfsmat for the companies it serves.
 */
export const FILING_SCOPES = [
  'report:read',
  'salary:submit',
  'equality:submit',
] as const

export const FILING_AND_SCORING_SCOPES = [
  ...FILING_SCOPES,
  'scoring:write',
] as const
