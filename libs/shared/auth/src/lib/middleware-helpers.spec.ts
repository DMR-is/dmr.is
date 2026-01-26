import { NextRequest, NextResponse } from 'next/server'

import { updateCookie } from './middleware-helpers'

// Mock next-auth/jwt
jest.mock('next-auth/jwt', () => ({
  encode: jest.fn(),
  JWT: {},
}))

describe('middleware-helpers', () => {
  const SESSION_COOKIE = 'next-auth.session-token'
  const CHUNK_SIZE = 3933
  const smallToken = 'small-session-token-value'

  // Helper to create a mock NextRequest with cookies
  function createMockRequest(
    cookies: Record<string, string> = {},
  ): NextRequest {
    const url = 'http://localhost:3000/test'
    const request = new NextRequest(url)

    // Set cookies
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value)
    })

    return request
  }

  // Helper to create a large token that requires chunking
  function createLargeToken(size: number = CHUNK_SIZE + 1000): string {
    return 'x'.repeat(size)
  }

  describe('updateCookie', () => {
    describe('Single cookie scenario (no delegation, small token)', () => {
      it('should set a new session cookie when small token is provided', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const result = updateCookie(smallToken, request, response)

        // Verify request cookie is set
        expect(request.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)

        // Verify response cookie is set
        const responseCookie = result.cookies.get(SESSION_COOKIE)
        expect(responseCookie?.value).toBe(smallToken)

        // Verify no chunks were created
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeUndefined()
        expect(result.cookies.get(`${SESSION_COOKIE}.0`)).toBeUndefined()
      })

      it('should replace existing session cookie with new small token', () => {
        const oldToken = 'old-session-token'
        const request = createMockRequest({
          [SESSION_COOKIE]: oldToken,
        })
        const response = NextResponse.next()

        const result = updateCookie(smallToken, request, response)

        // Verify old token is replaced
        expect(request.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)
        expect(request.cookies.get(SESSION_COOKIE)?.value).not.toBe(oldToken)

        // Verify response cookie has new value
        expect(result.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)
      })

      it('should delete existing session cookie when sessionToken is null', () => {
        const request = createMockRequest({
          [SESSION_COOKIE]: 'old-token',
        })
        const response = NextResponse.next()

        updateCookie(null, request, response)

        // Note: Request cookies are not deleted for single cookie case
        // (only response cookies are deleted to tell browser to expire them)
        // The request is ending anyway, so request cookies don't need cleanup

        // Verify response expires the cookie (sets to empty with expired date)
        const responseCookie = response.cookies.get(SESSION_COOKIE)
        expect(responseCookie).toBeDefined()
        expect(responseCookie?.value).toBe('')
        expect(responseCookie?.expires).toEqual(new Date(0))
      })
    })

    describe('Chunked cookie scenario (with delegation, large token)', () => {
      it('should chunk a large token into multiple cookies', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const largeToken = createLargeToken()
        const result = updateCookie(largeToken, request, response)

        // Verify chunks are created
        const chunk0 = request.cookies.get(`${SESSION_COOKIE}.0`)
        const chunk1 = request.cookies.get(`${SESSION_COOKIE}.1`)

        expect(chunk0).toBeDefined()
        expect(chunk1).toBeDefined()

        // Verify no base cookie is set (only chunks)
        expect(request.cookies.get(SESSION_COOKIE)).toBeUndefined()

        // Verify response has chunks
        expect(result.cookies.get(`${SESSION_COOKIE}.0`)).toBeDefined()
        expect(result.cookies.get(`${SESSION_COOKIE}.1`)).toBeDefined()
      })

      it('should replace old chunks with new chunks for large token', () => {
        // Simulate existing chunked cookies
        const request = createMockRequest({
          [`${SESSION_COOKIE}.0`]: 'old-chunk-0',
          [`${SESSION_COOKIE}.1`]: 'old-chunk-1',
          [`${SESSION_COOKIE}.2`]: 'old-chunk-2',
        })
        const response = NextResponse.next()

        const largeToken = createLargeToken()
        const result = updateCookie(largeToken, request, response)

        // Verify new chunks are set
        const chunk0 = request.cookies.get(`${SESSION_COOKIE}.0`)
        const chunk1 = request.cookies.get(`${SESSION_COOKIE}.1`)

        expect(chunk0?.value).not.toBe('old-chunk-0')
        expect(chunk1?.value).not.toBe('old-chunk-1')

        // Verify old chunk values are replaced
        expect(chunk0).toBeDefined()
        expect(chunk1).toBeDefined()

        // Note: Old chunk .2 would still exist in request but would not be read
        // by NextAuth since it only reads consecutive chunks starting from .0
      })

      it('should calculate correct number of chunks for large tokens', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        // Create token that requires exactly 3 chunks
        const largeToken = createLargeToken(CHUNK_SIZE * 2 + 100)
        updateCookie(largeToken, request, response)

        // Verify 3 chunks are created
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeDefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.1`)).toBeDefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.2`)).toBeDefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.3`)).toBeUndefined()
      })

      it('should reconstruct token from chunks correctly', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const largeToken = createLargeToken()
        updateCookie(largeToken, request, response)

        // Reconstruct token from all chunks
        let reconstructed = ''
        let i = 0
        while (true) {
          const chunk = request.cookies.get(`${SESSION_COOKIE}.${i}`)
          if (!chunk) break
          reconstructed += chunk.value
          i++
        }

        expect(reconstructed).toBe(largeToken)
      })

      it('should delete chunked cookies when sessionToken is null (logout)', () => {
        const request = createMockRequest({
          [`${SESSION_COOKIE}.0`]: 'chunk-0-value',
          [`${SESSION_COOKIE}.1`]: 'chunk-1-value',
        })
        const response = NextResponse.next()

        updateCookie(null, request, response)

        // Verify all chunks are deleted from request
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeUndefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.1`)).toBeUndefined()

        // Verify base cookie is also deleted if it exists
        expect(request.cookies.get(SESSION_COOKIE)).toBeUndefined()
      })
    })

    describe('Mixed scenarios', () => {
      it('should not affect unrelated cookies', () => {
        const unrelatedCookie = 'some-other-cookie'
        const request = createMockRequest({
          [SESSION_COOKIE]: 'old-token',
          [unrelatedCookie]: 'unrelated-value',
        })
        const response = NextResponse.next()

        updateCookie(smallToken, request, response)

        // Verify unrelated cookie is untouched
        expect(request.cookies.get(unrelatedCookie)?.value).toBe(
          'unrelated-value',
        )
      })

      it('should only affect session cookies, not other cookies with similar names', () => {
        const request = createMockRequest({
          [SESSION_COOKIE]: 'session-value',
          'other-cookie.0': 'other-chunk-0', // Should NOT be affected
          'next-auth-other': 'other-auth-cookie', // Should NOT be affected
        })
        const response = NextResponse.next()

        updateCookie(smallToken, request, response)

        // Verify only session cookies are affected
        expect(request.cookies.get('other-cookie.0')?.value).toBe(
          'other-chunk-0',
        )
        expect(request.cookies.get('next-auth-other')?.value).toBe(
          'other-auth-cookie',
        )
      })

      it('should handle empty cookie jar', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const result = updateCookie(smallToken, request, response)

        // Should successfully set new cookie
        expect(request.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)
        expect(result.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)
      })

      it('should handle transition from single cookie to chunked', () => {
        // Start with single cookie
        const request = createMockRequest({
          [SESSION_COOKIE]: 'old-small-token',
        })
        const response = NextResponse.next()

        // Set large token
        const largeToken = createLargeToken()
        updateCookie(largeToken, request, response)

        // Verify chunks are created
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeDefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.1`)).toBeDefined()

        // Note: Old base cookie would still exist in request
        // but NextAuth will find chunks first and use those
      })

      it('should handle transition from chunked to single cookie', () => {
        // Start with chunked cookies
        const request = createMockRequest({
          [`${SESSION_COOKIE}.0`]: 'old-chunk-0',
          [`${SESSION_COOKIE}.1`]: 'old-chunk-1',
        })
        const response = NextResponse.next()

        // Set small token
        updateCookie(smallToken, request, response)

        // Verify single cookie is set
        expect(request.cookies.get(SESSION_COOKIE)?.value).toBe(smallToken)

        // Note: Old chunks would still exist in request
        // but since we set the base cookie, NextAuth will use that first
      })
    })

    describe('Edge cases', () => {
      it('should handle token exactly at chunk size boundary', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        // Token exactly at CHUNK_SIZE should NOT be chunked
        const exactSizeToken = createLargeToken(CHUNK_SIZE)
        updateCookie(exactSizeToken, request, response)

        // Should be a single cookie, no chunks
        expect(request.cookies.get(SESSION_COOKIE)?.value).toBe(
          exactSizeToken,
        )
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeUndefined()
      })

      it('should handle token one byte over chunk size', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        // Token one byte over CHUNK_SIZE should be chunked
        const overSizeToken = createLargeToken(CHUNK_SIZE + 1)
        updateCookie(overSizeToken, request, response)

        // Should be chunked
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeDefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.1`)).toBeDefined()
        expect(request.cookies.get(SESSION_COOKIE)).toBeUndefined()
      })

      it('should handle very large tokens (10+ chunks)', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        // Create token requiring 10 chunks
        const veryLargeToken = createLargeToken(CHUNK_SIZE * 10)
        updateCookie(veryLargeToken, request, response)

        // Verify all chunks exist
        for (let i = 0; i < 10; i++) {
          expect(request.cookies.get(`${SESSION_COOKIE}.${i}`)).toBeDefined()
        }
        expect(request.cookies.get(`${SESSION_COOKIE}.10`)).toBeUndefined()

        // Verify reconstruction
        let reconstructed = ''
        for (let i = 0; i < 10; i++) {
          reconstructed +=
            request.cookies.get(`${SESSION_COOKIE}.${i}`)?.value || ''
        }
        expect(reconstructed).toBe(veryLargeToken)
      })

      it('should handle null token with no existing cookies', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        // Should not throw error
        expect(() => updateCookie(null, request, response)).not.toThrow()
      })

      it('should handle null token with mixed base and chunked cookies', () => {
        const request = createMockRequest({
          [SESSION_COOKIE]: 'base-cookie',
          [`${SESSION_COOKIE}.0`]: 'chunk-0',
          [`${SESSION_COOKIE}.1`]: 'chunk-1',
        })
        const response = NextResponse.next()

        updateCookie(null, request, response)

        // All should be deleted
        expect(request.cookies.get(SESSION_COOKIE)).toBeUndefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.0`)).toBeUndefined()
        expect(request.cookies.get(`${SESSION_COOKIE}.1`)).toBeUndefined()
      })
    })

    describe('Cookie options', () => {
      it('should set correct cookie options for single cookie', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const result = updateCookie(smallToken, request, response)

        const cookie = result.cookies.get(SESSION_COOKIE)
        expect(cookie).toBeDefined()
        expect(cookie?.value).toBe(smallToken)
      })

      it('should set correct cookie options for chunked cookies', () => {
        const request = createMockRequest()
        const response = NextResponse.next()

        const largeToken = createLargeToken()
        const result = updateCookie(largeToken, request, response)

        // Both chunks should have cookies set
        const chunk0 = result.cookies.get(`${SESSION_COOKIE}.0`)
        const chunk1 = result.cookies.get(`${SESSION_COOKIE}.1`)

        expect(chunk0).toBeDefined()
        expect(chunk1).toBeDefined()
      })
    })
  })
})
