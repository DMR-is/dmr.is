# Investigation: Invalid Compact JWE Error in Legal Gazette Apps

## Summary

All Legal Gazette applications (`legal-gazette-web`, `legal-gazette-application-web`, `legal-gazette-public-web`) experience "Invalid Compact JWE" errors after the middleware attempts to refresh the session token.

## Error Logs

```
Jan 23 14:17:03.040 - Token refreshed (SUCCESS)
Jan 23 14:17:03.063 - [next-auth][error][JWT_SESSION_ERROR] Invalid Compact JWE
Jan 23 14:17:03.067 - Error: No session found
```

**Key observation**: The error occurs **23 milliseconds after** the token refresh succeeds, on the **same request**.

## Root Cause: Cookie Chunk Collision

### How NextAuth Handles Large Cookies

NextAuth's `SessionStore` (in `node_modules/next-auth/core/lib/cookie.js`) automatically chunks session cookies that exceed 4KB:

1. **Chunk size limit**: `CHUNK_SIZE = 4096 - 163 = 3933 bytes`
2. **Chunk naming**: Large cookies are split into `session-token.0`, `session-token.1`, etc.
3. **Reading chunks**: SessionStore collects ALL cookies starting with the session name and joins them

```javascript
// SessionStore reads all cookies matching the pattern (lines 96-113)
if (name.startsWith(cookieName)) {
  chunks[name] = value;
}

// Then joins them (lines 115-123)
get value() {
  return sortedKeys.map(key => chunks[key]).join("");
}
```

### The Bug

**File**: `libs/shared/auth/src/lib/middleware-helpers.ts`

When the middleware refreshes the token (lines 30-43):

```typescript
if (sessionToken) {
  request.cookies.set(SESSION_COOKIE, sessionToken)  // Only sets BASE cookie
  response = NextResponse.next({...})
  response.cookies.set(SESSION_COOKIE, sessionToken, {...})
}
```

The middleware only sets the **base cookie name** (`__Secure-next-auth.session-token`), without deleting existing chunk cookies (`.0`, `.1`, etc.).

### Failure Sequence

1. **Login**: User logs in, NextAuth creates large token → chunks it into `.0`, `.1`
2. **Time passes**: Token expires, needs refresh
3. **Middleware refresh**:
   - Gets new tokens from Identity Server
   - Encodes new JWE
   - Sets **only** the base cookie name
   - **Does NOT delete** old chunk cookies
4. **Same request continues**: tRPC route or page calls `getServerSession()`
5. **NextAuth reads session**:
   - Finds `__Secure-next-auth.session-token` (new, from middleware)
   - Finds `__Secure-next-auth.session-token.0` (old chunk)
   - Finds `__Secure-next-auth.session-token.1` (old chunk)
   - Concatenates: `new_token + old_chunk_0 + old_chunk_1`
6. **Result**: Malformed JWE → "Invalid Compact JWE" error

## Why Initial Token Is Large

The session JWT contains full OIDC tokens from the Identity Server:

```typescript
interface JWT {
  accessToken: string     // ~1-2KB (full OIDC access token)
  idToken?: string        // ~1KB (full OIDC ID token)
  refreshToken?: string   // ~500B
  nationalId?: string
  name?: string
  // ... other fields
}
```

After JWE encryption and base64 encoding, total size can exceed 4KB, triggering NextAuth's chunking.

## Solution

### Option 1: Delete Existing Chunks (Recommended)

Add cleanup of existing chunks before setting new cookie:

```typescript
function deleteExistingChunks(
  request: NextRequest,
  response: NextResponse,
  baseName: string,
): void {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name === baseName || cookie.name.startsWith(`${baseName}.`)) {
      request.cookies.delete(cookie.name)
      response.cookies.set(cookie.name, '', { maxAge: 0 })
    }
  }
}

export function updateCookie(
  sessionToken: string | null,
  request: NextRequest,
  response: NextResponse,
): NextResponse<unknown> {
  // Clean up existing chunks FIRST
  deleteExistingChunks(request, response, SESSION_COOKIE)

  if (sessionToken) {
    // ... rest of implementation
  }
  return response
}
```

### Option 2: Implement Full Chunking (More Robust)

If tokens continue to be large, implement chunking similar to NextAuth:

```typescript
const CHUNK_SIZE = 3933;

function setChunkedCookie(
  request: NextRequest,
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions
): void {
  // Delete existing chunks
  deleteExistingChunks(request, response, name)

  if (value.length <= CHUNK_SIZE) {
    // Single cookie
    response.cookies.set(name, value, options)
  } else {
    // Split into chunks
    const chunks = Math.ceil(value.length / CHUNK_SIZE)
    for (let i = 0; i < chunks; i++) {
      const chunkName = `${name}.${i}`
      const chunkValue = value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      response.cookies.set(chunkName, chunkValue, options)
    }
  }
}
```

## Implementation Status

**Status**: ✅ **IMPLEMENTED** (2026-01-26)

### Changes Made

| File | Change | Status |
|------|--------|--------|
| [libs/shared/auth/src/lib/middleware-helpers.ts](../../../../libs/shared/auth/src/lib/middleware-helpers.ts) | Implemented cookie chunking support | ✅ Done |
| [libs/shared/auth/src/lib/middleware-helpers.spec.ts](../../../../libs/shared/auth/src/lib/middleware-helpers.spec.ts) | Added comprehensive test suite (20 tests) | ✅ Done |

### Implementation Details

The fix implements proper cookie chunking to match NextAuth's behavior:

1. **Detects chunking**: Checks if token exceeds `CHUNK_SIZE` (3933 bytes)
2. **Handles both scenarios**:
   - Small tokens (no delegation): Single cookie
   - Large tokens (with delegation): Chunked cookies (`.0`, `.1`, etc.)
3. **Proper cleanup**: Deletes old chunks when refreshing tokens
4. **NextAuth compatible**: Uses same chunk size and naming convention

### Test Coverage

All scenarios tested:
- Single cookie creation and updates
- Large token chunking
- Chunk reconstruction
- Cookie deletion (logout)
- Transition between single and chunked
- Edge cases (exact boundary, 10+ chunks)

All 20 tests passing ✅

## Verification Steps

1. Deploy fix to dev environment
2. Log in to any Legal Gazette app
3. Wait for token to expire (~50 minutes, or modify `renewalSeconds` in `token-service.ts` for testing)
4. Verify no "Invalid Compact JWE" errors in logs
5. Check browser cookies: should see single session cookie, no `.0`/`.1` chunks lingering

## Related Code References

- **Middleware helper**: `libs/shared/auth/src/lib/middleware-helpers.ts:15-49`
- **Token refresh**: `libs/shared/auth/src/lib/token-service.ts:26-104`
- **NextAuth SessionStore**: `node_modules/next-auth/core/lib/cookie.js:82-184`
- **App middleware**: `apps/legal-gazette-application-web/src/middleware.ts`

## Risk Assessment

- **Risk**: Low - change is isolated to cookie handling in middleware
- **Impact**: Fixes session errors for all Legal Gazette apps
- **Rollback**: Simple revert if issues arise
- **Testing**: Can test locally by shortening token expiry
