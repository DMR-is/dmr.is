import {
  mailboxAllowlistAllows,
  normalizeMailboxAllowlistValue,
  parseMailboxAllowlist,
} from './mailbox-allowlist'

describe('mailbox allowlist', () => {
  describe('normalizeMailboxAllowlistValue', () => {
    it.each([
      ['none', 'none'],
      [' NONE ', 'none'],
      ['*', '*'],
      [' * ', '*'],
      ['1234567890', '1234567890'],
      ['123456-7890, 0987654321', '1234567890,0987654321'],
      ['1234567890,1234567890', '1234567890'],
      ['1234567890, ', '1234567890'],
    ])('stores %p as %p', (value, stored) => {
      expect(normalizeMailboxAllowlistValue(value)).toBe(stored)
    })

    it.each(['', ' ', ',', 'all', '123456789', '12345678901', '1234567890,abc'])(
      'refuses %p',
      (value) => {
        expect(normalizeMailboxAllowlistValue(value)).toBeNull()
      },
    )
  })

  describe('parseMailboxAllowlist', () => {
    it.each([null, undefined, 'none', 'all', ''])(
      'reads %p as nobody',
      (value) => {
        const allowlist = parseMailboxAllowlist(value)
        expect(allowlist).toEqual({ all: false, nationalIds: new Set() })
        expect(mailboxAllowlistAllows(allowlist, '1234567890')).toBe(false)
      },
    )

    it('reads * as every company', () => {
      const allowlist = parseMailboxAllowlist('*')
      expect(mailboxAllowlistAllows(allowlist, '1234567890')).toBe(true)
      expect(mailboxAllowlistAllows(allowlist, null)).toBe(true)
    })

    it('allows only the named kennitölur, however they are written', () => {
      const allowlist = parseMailboxAllowlist('1234567890,0987654321')
      expect(mailboxAllowlistAllows(allowlist, '1234567890')).toBe(true)
      expect(mailboxAllowlistAllows(allowlist, '098765-4321')).toBe(true)
      expect(mailboxAllowlistAllows(allowlist, '2222222222')).toBe(false)
      expect(mailboxAllowlistAllows(allowlist, null)).toBe(false)
      expect(mailboxAllowlistAllows(allowlist, '')).toBe(false)
    })
  })
})
