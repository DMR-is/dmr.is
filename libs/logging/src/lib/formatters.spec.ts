import { TransformableInfo } from 'logform'
import { MESSAGE } from 'triple-beam'

import { maskNationalIdFormatter } from './formatters'

describe('maskNationalIdFormatter', () => {
  const messageSymbol = MESSAGE as unknown as string

  it('should mask national ids in message string', () => {
    // Arrange
    const transformer = maskNationalIdFormatter()

    // Act
    const result = transformer.transform({
      level: 'INFO',
      message: 'Ignored',
      [messageSymbol]: 'Test 0101307789, 010130-7789',
    })

    // Assert
    expect((result as TransformableInfo)[messageSymbol]).toMatchInlineSnapshot(
      `"Test **REMOVE_PII: 0101307789**, **REMOVE_PII: 010130-7789**"`,
    )
  })

  describe('metadata masking', () => {
    const transformer = maskNationalIdFormatter()

    it('should mask nationalId field in metadata', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'User logged in',
        [messageSymbol]: 'User logged in',
        nationalId: '0101307789',
      }) as TransformableInfo

      expect(result).toEqual({
        level: 'INFO',
        message: 'User logged in',
        [messageSymbol]: 'User logged in',
        nationalId: '**REMOVE_PII: $&**',
      })
    })

    it('should mask kennitala field in metadata', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'Processing request',
        [messageSymbol]: 'Processing request',
        kennitala: '0202306789',
      }) as TransformableInfo & { kennitala: string }

      expect(result.kennitala).toBe('**REMOVE_PII: $&**')
    })

    it('should mask ssn field in metadata', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'User data',
        [messageSymbol]: 'User data',
        ssn: '0303305678',
      }) as TransformableInfo & { ssn: string }

      expect(result.ssn).toBe('**REMOVE_PII: $&**')
    })

    it('should mask national_id field in metadata', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'API call',
        [messageSymbol]: 'API call',
        national_id: '0101307789',
      }) as TransformableInfo & { national_id: string }

      expect(result.national_id).toBe('**REMOVE_PII: $&**')
    })

    it('should mask nested PII fields', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'User operation',
        [messageSymbol]: 'User operation',
        user: {
          name: 'John Doe',
          nationalId: '0202306789',
          address: {
            city: 'Reykjavik',
            ssn: '0303305678',
          },
        },
      })

      expect(result).toEqual({
        level: 'INFO',
        message: 'User operation',
        [messageSymbol]: 'User operation',
        user: {
          name: 'John Doe',
          nationalId: '**REMOVE_PII: $&**',
          address: {
            city: 'Reykjavik',
            ssn: '**REMOVE_PII: $&**',
          },
        },
      })
    })

    it('should mask PII in arrays', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'Bulk operation',
        [messageSymbol]: 'Bulk operation',
        users: [
          { name: 'Alice', nationalId: '0101307789' },
          { name: 'Bob', kennitala: '0202306789' },
        ],
      })

      expect(result).toEqual({
        level: 'INFO',
        message: 'Bulk operation',
        [messageSymbol]: 'Bulk operation',
        users: [
          { name: 'Alice', nationalId: '**REMOVE_PII: $&**' },
          { name: 'Bob', kennitala: '**REMOVE_PII: $&**' },
        ],
      })
    })

    it('should handle null and undefined PII fields', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'Test',
        [messageSymbol]: 'Test',
        nationalId: null,
        kennitala: undefined,
      }) as TransformableInfo & { nationalId: null; kennitala: undefined }

      expect(result.nationalId).toBeNull()
      expect(result.kennitala).toBeUndefined()
    })

    it('should not modify non-PII fields', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'Operation',
        [messageSymbol]: 'Operation',
        userId: '12345',
        action: 'create',
        timestamp: '2024-01-01',
      })

      expect(result).toEqual({
        level: 'INFO',
        message: 'Operation',
        [messageSymbol]: 'Operation',
        userId: '12345',
        action: 'create',
        timestamp: '2024-01-01',
      })
    })

    it('should mask both message string and metadata', () => {
      const result = transformer.transform({
        level: 'INFO',
        message: 'User 0101307789 logged in',
        [messageSymbol]: 'User 0101307789 logged in',
        nationalId: '0202306789',
      }) as TransformableInfo & { nationalId: string }

      expect((result as TransformableInfo)[messageSymbol]).toContain(
        '**REMOVE_PII:',
      )
      expect(result.nationalId).toBe('**REMOVE_PII: $&**')
    })
  })
})
