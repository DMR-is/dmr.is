import { maskNationalId } from './maskNationalId'

describe('maskNationalId', () => {
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    originalNodeEnv = process.env['NODE_ENV']
  })

  afterEach(() => {
    process.env['NODE_ENV'] = originalNodeEnv
  })

  describe('in production', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'production'
    })

    it('should mask valid Icelandic national IDs', () => {
      const text = 'User with ID 010190-1234 logged in'
      const masked = maskNationalId(text)
      expect(masked).toBe('User with ID --MASKED-- logged in')
    })

    it('should mask multiple national IDs', () => {
      const text = 'IDs: 010190-1234 and 151201-5678'
      const masked = maskNationalId(text)
      expect(masked).toBe('IDs: --MASKED-- and --MASKED--')
    })

    it('should mask national IDs without hyphens', () => {
      const text = 'ID: 0101901234'
      const masked = maskNationalId(text)
      expect(masked).toBe('ID: --MASKED--')
    })

    it('should not mask invalid dates', () => {
      const text = 'Invalid: 320199-1234' // day 32
      const masked = maskNationalId(text)
      expect(masked).toBe('Invalid: 320199-1234')
    })

    it('should not mask invalid months', () => {
      const text = 'Invalid: 011399-1234' // month 13
      const masked = maskNationalId(text)
      expect(masked).toBe('Invalid: 011399-1234')
    })
  })

  describe('in development', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'development'
    })

    it('should add PII warning instead of masking', () => {
      const text = 'User with ID 010190-1234 logged in'
      const masked = maskNationalId(text)
      expect(masked).toBe('User with ID **REMOVE_PII: 010190-1234** logged in')
    })

    it('should warn for multiple national IDs', () => {
      const text = 'IDs: 010190-1234 and 151201-5678'
      const masked = maskNationalId(text)
      expect(masked).toContain('**REMOVE_PII: 010190-1234**')
      expect(masked).toContain('**REMOVE_PII: 151201-5678**')
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      process.env['NODE_ENV'] = 'production'
    })

    it('should handle empty strings', () => {
      const masked = maskNationalId('')
      expect(masked).toBe('')
    })

    it('should handle strings without national IDs', () => {
      const text = 'No national IDs here'
      const masked = maskNationalId(text)
      expect(masked).toBe('No national IDs here')
    })

    it('should handle national IDs at string boundaries', () => {
      const text = '010190-1234'
      const masked = maskNationalId(text)
      expect(masked).toBe('--MASKED--')
    })

    it('should mask valid dates only (day 01-31)', () => {
      expect(maskNationalId('010199-1234')).toBe('--MASKED--')
      expect(maskNationalId('311299-1234')).toBe('--MASKED--')
      expect(maskNationalId('000199-1234')).toBe('000199-1234') // day 00
      expect(maskNationalId('320199-1234')).toBe('320199-1234') // day 32
    })

    it('should mask valid months only (month 01-12)', () => {
      expect(maskNationalId('010199-1234')).toBe('--MASKED--')
      expect(maskNationalId('011299-1234')).toBe('--MASKED--')
      expect(maskNationalId('010099-1234')).toBe('010099-1234') // month 00
      expect(maskNationalId('011399-1234')).toBe('011399-1234') // month 13
    })
  })
})
