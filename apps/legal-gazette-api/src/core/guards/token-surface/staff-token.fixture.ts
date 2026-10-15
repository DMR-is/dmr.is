/**
 * Spec fixtures for tokens that reach `assertStaffToken`. Not imported by
 * application code, and excluded from the app build (`*.fixture.ts` in
 * tsconfig.app.json).
 */

const pinned = process.env.LEGAL_GAZETTE_WEB_CLIENT_ID

// Pinned in test-env.ts. Thrown rather than cast, so a lost pin fails every
// spec that uses it instead of building tokens for the client "undefined".
if (!pinned) {
  throw new Error('LEGAL_GAZETTE_WEB_CLIENT_ID is not pinned in test-env.ts')
}

export const STAFF_CLIENT_ID: string = pinned

/**
 * `user` as a legal-gazette-web token: `aud` is the staff client unless the
 * test sets it, and an explicit `aud: undefined` stays undefined.
 */
export const asStaffToken = <T extends object>(
  user: T,
): T & { aud?: unknown } =>
  'aud' in user ? user : { aud: STAFF_CLIENT_ID, ...user }
