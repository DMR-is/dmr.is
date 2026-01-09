import { maskNationalId, maskPiiInObject } from './maskNationalId'

describe('maskNationalId', () => {
  const ENV = process.env

  afterEach(() => {
    jest.resetModules()
    process.env = { ...ENV }
  })
  it('should mask national ids from text', () => {
    // Arrange
    const text = 'Test 0101307789, 010130-7789'

    // Act
    const result = maskNationalId(text)

    // Assert
    expect(result).toBe(
      'Test **REMOVE_PII: 0101307789**, **REMOVE_PII: 010130-7789**',
    )
  })

  it('should mask not mask 10 digit number from text', () => {
    // Arrange
    const text = 'Test 1234561234, 123456-1234'

    // Act
    const result = maskNationalId(text)

    // Assert
    expect(result).toBe(text)
  })

  it('should not display nationalId in production', async () => {
    // Arrange
    process.env.NODE_ENV = 'production'
    const text = 'https://island.is/api/0101307789/010130-7789/info'

    // Act
    const { maskNationalId } = await import('./maskNationalId')
    const result = maskNationalId(text)

    // Assert
    expect(result).toBe('https://island.is/api/--MASKED--/--MASKED--/info')
  })
})

describe('maskPiiInObject', () => {
  it('should mask nationalId field', () => {
    const result = maskPiiInObject({
      name: 'John',
      nationalId: '0101307789',
    })

    expect(result).toEqual({
      name: 'John',
      nationalId: '**REMOVE_PII: $&**',
    })
  })

  it('should mask kennitala field', () => {
    const result = maskPiiInObject({
      kennitala: '0202306789',
    })

    expect(result?.kennitala).toBe('**REMOVE_PII: $&**')
  })

  it('should mask ssn field', () => {
    const result = maskPiiInObject({
      ssn: '0303305678',
    })

    expect(result?.ssn).toBe('**REMOVE_PII: $&**')
  })

  it('should mask national_id field', () => {
    const result = maskPiiInObject({
      national_id: '0101307789',
    })

    expect(result?.national_id).toBe('**REMOVE_PII: $&**')
  })

  it('should mask nested PII fields', () => {
    const result = maskPiiInObject({
      user: {
        name: 'John',
        nationalId: '0202306789',
        address: {
          city: 'Reykjavik',
          ssn: '0303305678',
        },
      },
    })

    expect(result).toEqual({
      user: {
        name: 'John',
        nationalId: '**REMOVE_PII: $&**',
        address: {
          city: 'Reykjavik',
          ssn: '**REMOVE_PII: $&**',
        },
      },
    })
  })

  it('should mask PII in arrays', () => {
    const result = maskPiiInObject({
      users: [
        { name: 'Alice', nationalId: '0101307789' },
        { name: 'Bob', kennitala: '0202306789' },
      ],
    })

    expect(result).toEqual({
      users: [
        { name: 'Alice', nationalId: '**REMOVE_PII: $&**' },
        { name: 'Bob', kennitala: '**REMOVE_PII: $&**' },
      ],
    })
  })

  it('should handle null and undefined', () => {
    expect(maskPiiInObject(null)).toBeNull()
    expect(maskPiiInObject(undefined)).toBeUndefined()
  })

  it('should handle null/undefined PII fields', () => {
    const result = maskPiiInObject({
      nationalId: null,
      kennitala: undefined,
    })

    expect(result?.nationalId).toBeNull()
    expect(result?.kennitala).toBeUndefined()
  })

  it('should not modify non-PII fields', () => {
    const result = maskPiiInObject({
      userId: '12345',
      action: 'create',
    })

    expect(result).toEqual({
      userId: '12345',
      action: 'create',
    })
  })

  it('should not mask invalid kennitalas', () => {
    const result = maskPiiInObject({
      nationalId: '9999999999', // Invalid kennitala
    })

    expect(result?.nationalId).toBe('9999999999')
  })

  it('should not mask company kennitalas', () => {
    // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
    const result = maskPiiInObject({
      kennitala: '4208694809', // Company kennitala (day > 31)
    })

    expect(result?.kennitala).toBe('4208694809')
  })

  it('should handle circular references without stack overflow', () => {
    // Create an object with a circular reference
    interface CircularObject {
      name: string
      nationalId: string
      self?: CircularObject
      parent?: CircularObject
    }

    const obj: CircularObject = {
      name: 'Test',
      nationalId: '0101307789',
    }
    // Create circular reference
    obj.self = obj

    // Create nested circular reference
    const parent: CircularObject = {
      name: 'Parent',
      nationalId: '0202306789',
    }
    parent.parent = parent
    obj.parent = parent

    // This would cause "Maximum call stack size exceeded" without circular reference handling
    const result = maskPiiInObject(obj)

    // Should still mask the PII fields
    expect(result.nationalId).toBe('**REMOVE_PII: $&**')
    expect(result.name).toBe('Test')
    // Circular reference should be preserved (returns original object)
    expect(result.self).toBe(obj)
  })
})
