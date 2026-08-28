import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Issued API keys look like:
 *
 *   doe_live_3f9a1c04b7e28d55.Yk9sZ3B2c1FfMmhKdEJ3WHJOZTd4TDBhaVVjRGZFbQ
 *   └┬┘ └─┬┘ └───────┬──────┘ └──────────────────┬─────────────────────┘
 *  prefix env      keyId                       secret
 *
 * The key carries its own routing information so verification never has to
 * guess: `keyId` is the public half stored in `doe_api_key.key_id`, giving an
 * indexed single-row lookup, and only `secret` is ever hashed. `env` exists so
 * a staging key pasted into production fails on shape rather than on a hash
 * miss, which is a much clearer error to hand back to an integrator.
 *
 * `keyId` is hex, not base64url, deliberately: the base64url alphabet contains
 * `_`, which is also the field separator here, so a base64url keyId would make
 * the format ambiguous to parse. The secret sits after the `.` and is taken
 * whole, so `_` and `-` inside it are harmless.
 */
export const API_KEY_PREFIX = 'doe'

/** 8 bytes → 16 hex characters. An identifier, not a secret. */
export const API_KEY_ID_BYTES = 8

/** 32 bytes → 43 base64url characters. 256 bits of entropy. */
export const API_KEY_SECRET_BYTES = 32

/**
 * Minimum accepted pepper length. Deliberately a placeholder filter rather than
 * an entropy check — nothing here can tell 32 random bytes from 32 repeated
 * characters, and pretending otherwise would be worse than not checking.
 */
export const MIN_PEPPER_LENGTH = 32

const API_KEY_ID_LENGTH = API_KEY_ID_BYTES * 2
const API_KEY_SECRET_LENGTH = 43
const HASH_LENGTH = 64

const KEY_PATTERN = new RegExp(
  `^${API_KEY_PREFIX}_([a-z0-9]+)_([0-9a-f]{${API_KEY_ID_LENGTH}})\\.([A-Za-z0-9_-]{${API_KEY_SECRET_LENGTH}})$`,
)

const ENV_PATTERN = /^[a-z0-9]+$/

export type ParsedApiKey = {
  /** Environment segment, e.g. `live` or `dev`. */
  env: string
  /** Public half — the `doe_api_key.key_id` to look up. */
  keyId: string
  /** Secret half — hash this, never store or log it. */
  secret: string
}

export type GeneratedApiKey = ParsedApiKey & {
  /** The full plaintext key. Shown to the issuer exactly once. */
  key: string
}

/** Assembles the plaintext key from its parts. */
export const buildApiKey = (
  env: string,
  keyId: string,
  secret: string,
): string => `${API_KEY_PREFIX}_${env}_${keyId}.${secret}`

/**
 * Mints a new key. The caller is responsible for persisting
 * `hashApiKeySecret(secret, pepper)` and for showing `key` to the issuer once —
 * it cannot be recovered afterwards.
 */
export const generateApiKey = (env: string): GeneratedApiKey => {
  if (!ENV_PATTERN.test(env)) {
    throw new Error(
      `Invalid API key environment "${env}" — expected lowercase alphanumeric`,
    )
  }

  const keyId = randomBytes(API_KEY_ID_BYTES).toString('hex')
  const secret = randomBytes(API_KEY_SECRET_BYTES).toString('base64url')

  return { env, keyId, secret, key: buildApiKey(env, keyId, secret) }
}

/**
 * Splits a presented key into its parts, or returns null when it does not match
 * the issued shape. A null here means "reject" — it must not be reported to the
 * caller as anything more specific than an authentication failure, since the
 * distinction between a malformed key and an unknown one is not theirs to know.
 */
export const parseApiKey = (raw: string): ParsedApiKey | null => {
  const match = KEY_PATTERN.exec(raw.trim())

  if (!match) {
    return null
  }

  const [, env, keyId, secret] = match

  return { env, keyId, secret }
}

/**
 * HMAC-SHA256 of the secret under a server-side pepper, hex encoded.
 *
 * A slow KDF (bcrypt/argon2) buys nothing here: the input is 256 bits of
 * `randomBytes`, not a human-chosen password, so there is no dictionary to
 * grind and no cheap guess to make. What a plain digest would still leave open
 * is an attacker who has the table computing candidate hashes offline; the
 * pepper closes that, because a database leak alone does not carry the key
 * needed to verify anything. It also keeps the auth path cheap enough to run on
 * every request without a cache.
 */
export const hashApiKeySecret = (secret: string, pepper: string): string => {
  if (!pepper) {
    throw new Error('API key pepper is not configured')
  }

  // A floor, not a strength test. HMAC accepts a key of any length, so
  // `changeme` would otherwise be a working configuration and every digest in
  // the table would be forgeable by anyone who guessed it. 32 is the digest
  // size and the point past which length stops mattering — keys above the
  // 64-byte block are hashed down anyway. Enforced here rather than at the
  // config boundary because this is the one call both APIs must go through.
  if (pepper.length < MIN_PEPPER_LENGTH) {
    throw new Error(
      `API key pepper is too short: expected at least ${MIN_PEPPER_LENGTH} characters, got ${pepper.length}. Generate one with \`openssl rand -base64 32\`.`,
    )
  }

  return createHmac('sha256', pepper).update(secret).digest('hex')
}

/**
 * Constant-time comparison of a presented secret against a stored hash.
 *
 * Both sides are fixed-length hex, so lengths normally match; a stored hash of
 * the wrong length means a corrupt row rather than a wrong secret, and is
 * rejected without reaching `timingSafeEqual` (which throws on length
 * mismatch).
 */
export const verifyApiKeySecret = (
  secret: string,
  storedHash: string,
  pepper: string,
): boolean => {
  if (storedHash.length !== HASH_LENGTH) {
    return false
  }

  const expected = Buffer.from(storedHash, 'hex')
  const actual = Buffer.from(hashApiKeySecret(secret, pepper), 'hex')

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}
