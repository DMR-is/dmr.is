import { NextRequest, NextResponse } from 'next/server'
import { encode, JWT } from 'next-auth/jwt'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { withAuth } from 'next-auth/middleware'

import { refreshAccessToken } from './token-service'
import { isExpired } from './token-service'

const SESSION_SECURE = process.env.NODE_ENV === 'production'
const SESSION_COOKIE = SESSION_SECURE
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token'
const SESSION_TIMEOUT = 60 * 60 // 1 hour

/**
 * NextAuth's chunk size for cookies (4096 - overhead = 3933 bytes)
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/cookie.ts
 */
const CHUNK_SIZE = 3933

interface CookieOptions {
  httpOnly: boolean
  maxAge: number
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none'
}

/**
 * Deletes all existing session cookies including chunks.
 *
 * When delegation is used, NextAuth automatically chunks large session tokens
 * into multiple cookies (e.g., session-token.0, session-token.1).
 *
 * @returns Array of cookie names that were deleted
 */
function deleteExistingChunks(
  request: NextRequest,
  baseName: string,
): string[] {
  const cookiesToDelete: string[] = []

  // Collect all cookies that match the session pattern
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name === baseName || cookie.name.startsWith(`${baseName}.`)) {
      cookiesToDelete.push(cookie.name)
    }
  }

  // Delete them from the request
  for (const cookieName of cookiesToDelete) {
    request.cookies.delete(cookieName)
  }

  return cookiesToDelete
}

/**
 * Checks if the existing session uses chunked cookies.
 */
function hasChunkedCookies(request: NextRequest, baseName: string): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith(`${baseName}.`))
}

export function updateCookie(
  sessionToken: string | null,
  request: NextRequest,
  response: NextResponse,
): NextResponse<unknown> {
  /*
   * BASIC IDEA:
   *
   * 1. Set request cookies for the incoming getServerSession to read new session
   * 2. Updated request cookie can only be passed to server if it's passed down here after setting its updates
   * 3. Set response cookies to send back to browser
   */

  if (sessionToken) {
    // Create a new response to ensure headers are fresh
    response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      maxAge: SESSION_TIMEOUT,
      secure: SESSION_SECURE,
      sameSite: 'lax',
    }
    /**
     * When delegation is used, tokens can exceed 4KB, requiring chunking.
     * This function mimics NextAuth's chunking behavior to prevent
     * "Invalid Compact JWE" errors.
     *
     * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/cookie.ts
     */
    if (sessionToken.length <= CHUNK_SIZE) {
      // Single cookie - no chunking needed
      request.cookies.set(SESSION_COOKIE, sessionToken)
      response.cookies.set(SESSION_COOKIE, sessionToken, cookieOptions)
    } else {
      // Split into chunks
      const chunkCount = Math.ceil(sessionToken.length / CHUNK_SIZE)
      for (let i = 0; i < chunkCount; i++) {
        const chunkName = `${SESSION_COOKIE}.${i}`
        const chunkValue = sessionToken.substring(
          i * CHUNK_SIZE,
          (i + 1) * CHUNK_SIZE,
        )
        request.cookies.set(chunkName, chunkValue)
        response.cookies.set(chunkName, chunkValue, cookieOptions)
      }
    }
  } else {
    if (hasChunkedCookies(request, SESSION_COOKIE)) {
      const deletedCookies = deleteExistingChunks(request, SESSION_COOKIE)
      // Also delete from response
      for (const cookieName of deletedCookies) {
        response.cookies.delete(cookieName)
      }
    } else {
      response.cookies.delete(SESSION_COOKIE)
    }
  }

  return response
}

export async function tryToUpdateCookie(
  clientId: string,
  clientSecret: string,
  req: NextRequest,
  token: JWT,
  response: NextResponse,
  redirectUri: string,
): Promise<NextResponse> {
  try {
    const newToken = await refreshAccessToken(
      token as JWT,
      redirectUri,
      clientId,
      clientSecret,
    )

    if (newToken.invalid) {
      return updateCookie(null, req, response)
    }

    const newSessionToken = await encode({
      secret: process.env.NEXTAUTH_SECRET as string,
      token: newToken,
      maxAge: SESSION_TIMEOUT,
    })
    return updateCookie(newSessionToken, req, response)
  } catch (error) {
    return updateCookie(null, req, response)
  }
}

const DEFAULT_URL = '/'

export interface CreateAuthMiddlewareConfig {
  clientId: string
  clientSecret: string
  redirectUriEnvVar: string
  fallbackRedirectUri: string
  signInPath: string
  checkIsActive?: boolean
  skipDefaultUrlCheck?: boolean
}

export function createAuthMiddleware(config: CreateAuthMiddlewareConfig) {
  const {
    clientId,
    clientSecret,
    redirectUriEnvVar,
    fallbackRedirectUri,
    signInPath,
    checkIsActive = false,
    skipDefaultUrlCheck = false,
  } = config

  const middleware = withAuth(
    async function middleware(req: NextRequestWithAuth) {
      let response = NextResponse.next()

      const token = req.nextauth.token

      if (token && isExpired(token.accessToken as string, !!token.invalid)) {
        const redirectUri =
          process.env[redirectUriEnvVar] ?? fallbackRedirectUri
        response = await tryToUpdateCookie(
          clientId,
          clientSecret,
          req,
          token,
          response,
          redirectUri,
        )
      }
      return response
    },
    {
      pages: {
        signIn: signInPath,
      },
      callbacks: {
        authorized: ({ token, req }) => {
          const requestedPath = req.nextUrl.pathname

          const defaultUrlCheck = skipDefaultUrlCheck
            ? false
            : DEFAULT_URL === requestedPath
          if (defaultUrlCheck || requestedPath.includes('/api/trpc')) {
            return true
          }

          if (checkIsActive) {
            return !!token && !token.invalid && !!token.isActive
          }

          return !!token && !token.invalid
        },
      },
    },
  )

  return middleware
}
