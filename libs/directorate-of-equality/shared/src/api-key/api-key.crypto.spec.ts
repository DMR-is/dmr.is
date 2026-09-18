import {
  API_KEY_PREFIX,
  buildApiKey,
  generateApiKey,
  hashApiKeySecret,
  MIN_PEPPER_LENGTH,
  parseApiKey,
  verifyApiKeySecret,
} from './api-key.crypto'

const PEPPER = 'spec-pepper-not-a-real-secret-but-long-enough'

describe('api-key crypto', () => {
  describe('generateApiKey', () => {
    it('mints a key that parses back to its own parts', () => {
      const generated = generateApiKey('live')

      expect(parseApiKey(generated.key)).toEqual({
        env: 'live',
        keyId: generated.keyId,
        secret: generated.secret,
      })
    })

    it('produces a 16 hex character keyId and a 43 character secret', () => {
      const { keyId, secret } = generateApiKey('dev')

      expect(keyId).toMatch(/^[0-9a-f]{16}$/)
      expect(secret).toHaveLength(43)
    })

    it('never repeats a keyId or secret across mints', () => {
      const keys = Array.from({ length: 50 }, () => generateApiKey('live'))

      expect(new Set(keys.map((k) => k.keyId)).size).toBe(50)
      expect(new Set(keys.map((k) => k.secret)).size).toBe(50)
    })

    it('rejects an environment that would make the key ambiguous to parse', () => {
      expect(() => generateApiKey('live_extra')).toThrow(
        /Invalid API key environment/,
      )
      expect(() => generateApiKey('LIVE')).toThrow(
        /Invalid API key environment/,
      )
      expect(() => generateApiKey('')).toThrow(/Invalid API key environment/)
    })
  })

  describe('parseApiKey', () => {
    it('tolerates surrounding whitespace', () => {
      const { key, keyId } = generateApiKey('live')

      expect(parseApiKey(`  ${key}\n`)?.keyId).toBe(keyId)
    })

    it('returns null for anything that is not an issued key shape', () => {
      const { env, keyId, secret } = generateApiKey('live')

      const rejected = [
        '',
        'not-a-key',
        // wrong prefix
        buildApiKey(env, keyId, secret).replace(API_KEY_PREFIX, 'xyz'),
        // missing the secret half
        `${API_KEY_PREFIX}_${env}_${keyId}`,
        // keyId truncated
        buildApiKey(env, keyId.slice(0, 15), secret),
        // keyId outside the hex alphabet
        buildApiKey(env, 'zzzzzzzzzzzzzzzz', secret),
        // secret truncated
        buildApiKey(env, keyId, secret.slice(0, 42)),
        // separator swapped
        `${API_KEY_PREFIX}_${env}_${keyId}_${secret}`,
      ]

      for (const candidate of rejected) {
        expect(parseApiKey(candidate)).toBeNull()
      }
    })

    it('keeps a secret containing base64url punctuation intact', () => {
      // The secret sits after the `.` and is taken whole, so `-` and `_` in it
      // must survive parsing even though `_` is the field separator.
      const secret = `ab-cd_ef${'x'.repeat(35)}`
      const parsed = parseApiKey(buildApiKey('live', 'a'.repeat(16), secret))

      expect(parsed?.secret).toBe(secret)
    })
  })

  describe('hashApiKeySecret', () => {
    it('is deterministic under the same pepper', () => {
      const { secret } = generateApiKey('live')

      expect(hashApiKeySecret(secret, PEPPER)).toBe(
        hashApiKeySecret(secret, PEPPER),
      )
    })

    it('produces a different hash under a different pepper', () => {
      const { secret } = generateApiKey('live')

      expect(hashApiKeySecret(secret, PEPPER)).not.toBe(
        hashApiKeySecret(secret, 'a-different-pepper-also-long-enough-to-pass'),
      )
    })

    it('never returns the secret itself', () => {
      const { secret } = generateApiKey('live')
      const hash = hashApiKeySecret(secret, PEPPER)

      expect(hash).toMatch(/^[0-9a-f]{64}$/)
      expect(hash).not.toContain(secret)
    })

    it('refuses to hash without a configured pepper', () => {
      expect(() => hashApiKeySecret('secret', '')).toThrow(
        'API key pepper is not configured',
      )
    })

    it('refuses a pepper short enough to be a placeholder', () => {
      // HMAC would happily accept these, which is the point of the floor.
      for (const weak of ['changeme', 'x', 'a'.repeat(MIN_PEPPER_LENGTH - 1)]) {
        expect(() => hashApiKeySecret('secret', weak)).toThrow(
          /pepper is too short/,
        )
      }
    })

    it('accepts a pepper exactly at the floor', () => {
      expect(() =>
        hashApiKeySecret('secret', 'a'.repeat(MIN_PEPPER_LENGTH)),
      ).not.toThrow()
    })

    it('accepts what the documented generator produces', () => {
      // openssl rand -base64 32 -> 44 characters
      const generated = Buffer.from('b'.repeat(32)).toString('base64')

      expect(generated.length).toBeGreaterThanOrEqual(MIN_PEPPER_LENGTH)
      expect(() => hashApiKeySecret('secret', generated)).not.toThrow()
    })
  })

  describe('verifyApiKeySecret', () => {
    it('accepts the secret it was derived from', () => {
      const { secret } = generateApiKey('live')

      expect(
        verifyApiKeySecret(secret, hashApiKeySecret(secret, PEPPER), PEPPER),
      ).toBe(true)
    })

    it('rejects a different secret', () => {
      const stored = hashApiKeySecret(generateApiKey('live').secret, PEPPER)

      expect(
        verifyApiKeySecret(generateApiKey('live').secret, stored, PEPPER),
      ).toBe(false)
    })

    it('rejects the right secret under the wrong pepper', () => {
      const { secret } = generateApiKey('live')
      const stored = hashApiKeySecret(secret, PEPPER)

      expect(
        verifyApiKeySecret(
          secret,
          stored,
          'rotated-pepper-also-long-enough-to-pass-ok',
        ),
      ).toBe(false)
    })

    it('rejects a stored hash of the wrong length instead of throwing', () => {
      // timingSafeEqual throws on a length mismatch, so a corrupt row must be
      // caught before it reaches the comparison.
      const { secret } = generateApiKey('live')

      expect(verifyApiKeySecret(secret, '', PEPPER)).toBe(false)
      expect(verifyApiKeySecret(secret, 'deadbeef', PEPPER)).toBe(false)
      expect(verifyApiKeySecret(secret, 'f'.repeat(63), PEPPER)).toBe(false)
      expect(verifyApiKeySecret(secret, 'f'.repeat(65), PEPPER)).toBe(false)
    })
  })
})
