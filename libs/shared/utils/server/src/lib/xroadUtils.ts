import { isUUID } from 'class-validator'

/**
 * Thrown when an application id cannot be safely placed in an X-Road callback
 * URL. Callers catch this to log the rejection with their own context before
 * mapping it onto an HTTP response.
 */
export class InvalidCallbackUrlError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCallbackUrlError'
  }
}

/**
 * Builds an island.is `application-callback-v2` URL for one application id.
 *
 * The id reaches this function from the request body or from a database column
 * the applicant filled in, so it is untrusted. Node's `fetch` normalises `..`
 * segments when it parses a URL, which means a raw
 * `${basePath}/.../applications/${id}` template lets that value rewrite the
 * whole X-Road path — and the request that follows carries the DMR service
 * account's bearer token and `X-Road-Client` header, so it would reach any
 * service the security server can route to.
 *
 * Three things stop that: the id must be a UUID, it is percent-encoded into a
 * single path segment, and the resolved URL must still sit under `basePath`.
 *
 * @param basePath X-Road gateway prefix, i.e. `XROAD_ISLAND_IS_PATH`.
 * @param applicationId Untrusted island.is application id.
 * @param path Optional trailing segment, e.g. `submit`. Caller-controlled
 *   constant, never user input.
 * @throws {InvalidCallbackUrlError} when the id is not a UUID or the resolved
 *   URL escapes `basePath`.
 */
export function applicationCallbackUrl(
  basePath: string,
  applicationId: string,
  path = '',
): string {
  if (!isUUID(applicationId)) {
    throw new InvalidCallbackUrlError(
      'Refusing to build a callback URL for a non-UUID application id',
    )
  }

  // The trailing slash matters: without it `new URL(relative, base)` drops the
  // last segment of the configured X-Road path.
  let base: URL
  try {
    base = new URL(basePath.endsWith('/') ? basePath : `${basePath}/`)
  } catch {
    // An unset XROAD_ISLAND_IS_PATH used to interpolate the string
    // "undefined" into the URL and fail at the fetch; name it instead.
    throw new InvalidCallbackUrlError(
      'X-Road base path is missing or not an absolute URL',
    )
  }

  const suffix = path ? `/${path}` : ''
  const url = new URL(
    `application-callback-v2/applications/${encodeURIComponent(applicationId)}${suffix}`,
    base,
  )

  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new InvalidCallbackUrlError(
      'Refusing to call a URL outside the configured X-Road path',
    )
  }

  return url.toString()
}
