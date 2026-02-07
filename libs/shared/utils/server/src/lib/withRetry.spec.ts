import { withRetry } from './withRetry'

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('successful execution', () => {
    it('should return result immediately on first success', async () => {
      const mockFn = jest.fn().mockResolvedValue('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should return result after retries on eventual success', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(3)

      jest.restoreAllMocks()
    })
  })

  describe('failure after max retries', () => {
    it('should throw last error after exhausting retries', async () => {
      // Mock setTimeout to execute immediately for fast testing
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const finalError = new Error('Persistent failure')
      const mockFn = jest.fn().mockRejectedValue(finalError)

      await expect(withRetry(mockFn, { maxRetries: 3 })).rejects.toThrow(
        'Persistent failure',
      )

      // Should have called: initial + 3 retries = 4 times
      expect(mockFn).toHaveBeenCalledTimes(4)

      jest.restoreAllMocks()
    })

    it('should throw immediately with maxRetries=0', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Immediate fail'))

      await expect(withRetry(mockFn, { maxRetries: 0 })).rejects.toThrow(
        'Immediate fail',
      )

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('exponential backoff', () => {
    it('should use exponential backoff between retries', async () => {
      const delays: number[] = []

      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        // Execute callback immediately for testing
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success')

      await withRetry(mockFn, { baseDelayMs: 1000, maxRetries: 3 })

      // First retry: 1000ms, second retry: 2000ms
      expect(delays).toEqual([1000, 2000])

      jest.restoreAllMocks()
    })

    it('should cap delay at maxDelayMs', async () => {
      const delays: number[] = []

      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockRejectedValueOnce(new Error('Fail 4'))

      await expect(
        withRetry(mockFn, {
          baseDelayMs: 1000,
          maxDelayMs: 3000,
          maxRetries: 3,
        }),
      ).rejects.toThrow()

      // Delays: 1000, 2000, 3000 (capped, would be 4000)
      expect(delays).toEqual([1000, 2000, 3000])
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(3000)
      })

      jest.restoreAllMocks()
    })

    it('should use default baseDelayMs of 1000ms', async () => {
      const delays: number[] = []

      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success')

      await withRetry(mockFn)

      expect(delays[0]).toBe(1000) // Default baseDelayMs

      jest.restoreAllMocks()
    })

    it('should use default maxDelayMs of 10000ms', async () => {
      const delays: number[] = []

      jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        delays.push(delay as number)
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockRejectedValueOnce(new Error('Fail 4'))

      await expect(withRetry(mockFn, { baseDelayMs: 5000 })).rejects.toThrow()

      // Delays: 5000, 10000 (capped, would be 10000), 10000 (capped, would be 20000)
      delays.forEach((delay) => {
        expect(delay).toBeLessThanOrEqual(10000) // Default maxDelayMs
      })

      jest.restoreAllMocks()
    })
  })

  describe('onRetry callback', () => {
    it('should invoke onRetry callback with attempt number and error', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const onRetryMock = jest.fn()
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success')

      await withRetry(mockFn, { onRetry: onRetryMock })

      expect(onRetryMock).toHaveBeenCalledTimes(2)
      expect(onRetryMock).toHaveBeenCalledWith(1, expect.any(Error))
      expect(onRetryMock).toHaveBeenCalledWith(2, expect.any(Error))

      jest.restoreAllMocks()
    })

    it('should not invoke onRetry on final failure', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const onRetryMock = jest.fn()
      const mockFn = jest.fn().mockRejectedValue(new Error('Fail'))

      await expect(
        withRetry(mockFn, { maxRetries: 2, onRetry: onRetryMock }),
      ).rejects.toThrow()

      // Should be called 2 times (once per retry, not on initial or final)
      expect(onRetryMock).toHaveBeenCalledTimes(2)

      jest.restoreAllMocks()
    })

    it('should not invoke onRetry when first attempt succeeds', async () => {
      const onRetryMock = jest.fn()
      const mockFn = jest.fn().mockResolvedValue('success')

      await withRetry(mockFn, { onRetry: onRetryMock })

      expect(onRetryMock).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle functions returning undefined', async () => {
      const mockFn = jest.fn().mockResolvedValue(undefined)

      const result = await withRetry(mockFn)

      expect(result).toBeUndefined()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle functions returning null', async () => {
      const mockFn = jest.fn().mockResolvedValue(null)

      const result = await withRetry(mockFn)

      expect(result).toBeNull()
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should handle non-Error rejections', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce('String error')
        .mockResolvedValueOnce('success')

      const result = await withRetry(mockFn)

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)

      jest.restoreAllMocks()
    })
  })

  describe('default options', () => {
    it('should use default maxRetries of 3', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest.fn().mockRejectedValue(new Error('Fail'))

      await expect(withRetry(mockFn)).rejects.toThrow()

      // Initial + 3 retries = 4 calls
      expect(mockFn).toHaveBeenCalledTimes(4)

      jest.restoreAllMocks()
    })

    it('should work with empty options object', async () => {
      jest.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        ;(callback as () => void)()
        return {} as NodeJS.Timeout
      })

      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success')

      const result = await withRetry(mockFn, {})

      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(2)

      jest.restoreAllMocks()
    })
  })
})
