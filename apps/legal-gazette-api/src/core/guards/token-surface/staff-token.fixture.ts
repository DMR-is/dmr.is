/**
 * Spec fixtures for tokens that reach `assertStaffToken`. Not imported by
 * application code.
 */

// Pinned in test-env.ts
export const STAFF_CLIENT_ID = process.env.LEGAL_GAZETTE_WEB_CLIENT_ID as string

/**
 * `user` as a legal-gazette-web token: `aud` is the staff client unless the
 * test sets it, and an explicit `aud: undefined` stays undefined.
 */
export const asStaffToken = <T extends object>(
  user: T,
): T & { aud?: unknown } =>
  'aud' in user ? user : { aud: STAFF_CLIENT_ID, ...user }
