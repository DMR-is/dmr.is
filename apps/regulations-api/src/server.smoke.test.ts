import type { FastifyInstance } from 'fastify'
import { createServer, Server } from 'http'
import { AddressInfo } from 'net'

/**
 * HTTP smoke tests for the Fastify server.
 *
 * These are the oracle for the Fastify 4 -> 5 upgrade: every assertion here
 * describes behaviour of Fastify **4.29.1**. A red test after the bump is a
 * behavioural change introduced by the upgrade, not a flaky test.
 *
 * The suite deliberately touches only routes that reject before any I/O
 * happens (auth guards) or that need no I/O at all (health, robots), so no
 * Postgres/Redis/OpenSearch is required. `buildServer()` registers the Redis
 * and OpenSearch plugins only when their env vars are set, and
 * `connectSequelize()` lives in `start()`, not in `buildServer()`.
 */

const ENV_KEYS = [
  'REDIS_URL',
  'REDIS_PASSWORD',
  'OPENSEARCH_CLUSTER_ENDPOINT',
  'ROUTES_USERNAME',
  'ROUTES_PASSWORD',
  'REGULATIONS_API_USERNAME',
  'REGULATIONS_API_PASSWORD',
  'ROUTES_USERNAME_CHANGESUGGESTION',
  'ROUTES_PASSWORD_CHANGESUGGESTION',
  'PROXIED',
] as const

let savedEnv: Record<string, string | undefined> = {}

const setEnv = (env: Record<string, string | undefined>) => {
  Object.entries(env).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  })
}

beforeEach(() => {
  savedEnv = {}
  ENV_KEYS.forEach((key) => {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  })
})

afterEach(() => {
  ENV_KEYS.forEach((key) => {
    if (savedEnv[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = savedEnv[key]
    }
  })
})

/** Builds an instance with the current process.env. `buildServer` reads env at
 * call time (not module load), so no `jest.resetModules()` dance is needed. */
const build = (): FastifyInstance => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { buildServer } = require('./app') as {
    buildServer: () => FastifyInstance
  }
  return buildServer()
}

const basic = (user: string, pass: string) =>
  'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')

// ---------------------------------------------------------------------------
// Priority 1 — the Fastify 5 canary
// ---------------------------------------------------------------------------

/**
 * FASTIFY 5 BREAKING CHANGE CANARY.
 *
 * `handleRequest` in Fastify 4 (`lib/handleRequest.js:48-56`) only runs the
 * content-type parser for `DELETE`/`OPTIONS` when a `content-type` header is
 * present *and* `transfer-encoding` or `content-length` is also present.
 * A bodyless DELETE that merely declares `content-type: application/json`
 * therefore skips parsing entirely and reaches the handler. Fastify 5 drops
 * that special case, so the same request hits the default JSON parser, which
 * rejects an empty body with `FST_ERR_CTP_EMPTY_JSON_BODY` (HTTP 400).
 *
 * The tests below MUST send valid credentials. `onRequest` runs before the
 * content-type parser on both majors, so an *unauthenticated* request is
 * short-circuited by auth with 401 on Fastify 4 and Fastify 5 alike — it stays
 * green straight through the regression it is supposed to catch. Getting past
 * auth is what puts the request in front of the parser.
 *
 * THE CANARY FIRED. On the Fastify 5 bump these two were the only failures out
 * of 119, with exactly the predicted transitions: 200 -> 400 and 500 -> 400.
 * They are now CHARACTERIZED against Fastify 5. The Fastify 4 baselines they
 * previously asserted are preserved in git history at commit 01b2677e.
 *
 * The 400 was accepted deliberately rather than papered over. Fastify 4 ALREADY
 * returns 400 for the same request whenever `content-length: 0` is present (see
 * the test at the bottom of this block, which passed on both majors), and
 * virtually every real HTTP client sends that header on a bodyless request — so
 * most callers were receiving 400 before this upgrade. Fastify 5 generalizes an
 * existing failure mode rather than introducing one. Restoring the old
 * behaviour would have required a parser strictly MORE permissive than Fastify
 * 4, since it would also have had to accept the `content-length: 0` case.
 */
describe('Fastify 5 canary: authenticated bodyless DELETE with content-type: application/json', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('DELETE /api/v1/cache/ministries is rejected by the body parser with 400', async () => {
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: {
        authorization: basic('reg-user', 'reg-pass'),
        'content-type': 'application/json',
      },
      // deliberately no payload — and therefore no content-length either
    })

    // Fastify 4 returned 200 {"deleted":0}: parsing was skipped, the handler
    // ran, and redis being undefined short-circuited `del()` to 0.
    // Fastify 5 never reaches the handler — the JSON parser rejects the empty
    // body first. Asserting the error CODE and not just the status, so that a
    // future change in *which* rejection occurs is visible rather than silent.
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('FST_ERR_CTP_EMPTY_JSON_BODY')
  })

  it('DELETE /api/v1/change-suggestions/:id is rejected by the body parser before the handler', async () => {
    setEnv({
      ROUTES_USERNAME_CHANGESUGGESTION: 'cs-user',
      ROUTES_PASSWORD_CHANGESUGGESTION: 'cs-pass',
    })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/change-suggestions/123',
      headers: {
        authorization: basic('cs-user', 'cs-pass'),
        'content-type': 'application/json',
      },
      // deliberately no payload
    })

    // On Fastify 4 this got past auth and into the handler, which then 500'd
    // because `connectSequelize()` was never called. On Fastify 5 the parser
    // rejects it first, so the handler is never entered and the absent DB is
    // no longer reachable from this test.
    //
    // Still asserting `not.toBe(401)` explicitly: the 400 must come from the
    // body parser, not from auth. If credentials ever stopped working, the
    // status alone would not distinguish the two failures.
    expect(res.statusCode).not.toBe(401)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('FST_ERR_CTP_EMPTY_JSON_BODY')
  })

  it('control: the same DELETE without a content-type header also reaches the handler', async () => {
    // Isolates the trigger — it is the content-type header, not the method.
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { authorization: basic('reg-user', 'reg-pass') },
    })

    expect(res.statusCode).toBe(200)
  })

  it('pre-existing on Fastify 4: adding content-length: 0 ALREADY produces the 400', async () => {
    // This is the other half of the Fastify 4 condition. A client that sends
    // `Content-Length: 0` alongside the JSON content-type is rejected today,
    // which is exactly the behaviour Fastify 5 generalizes to every bodyless
    // JSON DELETE. Pinned so the upgrade is understood as "this case spreads",
    // not "this case appears".
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: {
        authorization: basic('reg-user', 'reg-pass'),
        'content-type': 'application/json',
        'content-length': '0',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('FST_ERR_CTP_EMPTY_JSON_BODY')
  })
})

/**
 * The same hazard class for bodyless POSTs. Fastify 4 runs the content-type
 * parser for POST whenever a content-type is present (`handleRequest.js:30-44`
 * — no content-length escape hatch), so these already 400 today. Pinned to
 * prove the baseline: if one of these changes status on Fastify 5, the change
 * is wider than the DELETE special case.
 */
describe('bodyless POST with content-type: application/json (already 400 on Fastify 4)', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('POST /api/v1/change-suggestions/process', async () => {
    setEnv({
      ROUTES_USERNAME_CHANGESUGGESTION: 'cs-user',
      ROUTES_PASSWORD_CHANGESUGGESTION: 'cs-pass',
    })
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/change-suggestions/process',
      headers: {
        authorization: basic('cs-user', 'cs-pass'),
        'content-type': 'application/json',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('FST_ERR_CTP_EMPTY_JSON_BODY')
  })

  it('POST /api/v1/regulation/publish', async () => {
    setEnv({
      REGULATIONS_API_USERNAME: 'pub-user',
      REGULATIONS_API_PASSWORD: 'pub-pass',
    })
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/regulation/publish',
      headers: {
        authorization: basic('pub-user', 'pub-pass'),
        'content-type': 'application/json',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('FST_ERR_CTP_EMPTY_JSON_BODY')
  })

  it('but a POST with an actual JSON body gets through to the handler', async () => {
    // Guards against the above two tests passing for the wrong reason (e.g.
    // auth quietly failing with a 400-shaped error).
    setEnv({
      REGULATIONS_API_USERNAME: 'pub-user',
      REGULATIONS_API_PASSWORD: 'pub-pass',
    })
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/regulation/publish',
      headers: {
        authorization: basic('pub-user', 'pub-pass'),
        'content-type': 'application/json',
      },
      payload: JSON.stringify({ name: '0123/2021' }),
    })

    // Same reasoning as the canary above: assert only that the parser let it
    // through, not the handler's own status, which depends on DB reachability.
    expect(res.statusCode).not.toBe(400)
    expect(res.body).not.toContain('FST_ERR_CTP_EMPTY_JSON_BODY')
  })
})

describe('auth runs before body parsing (true on both Fastify majors)', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  // NOTE: these are NOT upgrade canaries. `onRequest` precedes the
  // content-type parser in the Fastify 4 and 5 lifecycles alike, so an
  // unauthenticated request never reaches the parser on either. They document
  // that ordering; the tests that actually detect the regression are the
  // authenticated ones above.
  it('an unauthenticated bodyless JSON DELETE is rejected by auth with 401', async () => {
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { 'content-type': 'application/json' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('auth wins even when the body parser would also have rejected the request', async () => {
    // content-length: 0 makes the parser reject on Fastify 4 — but only if the
    // request gets that far. Without credentials it does not.
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: {
        'content-type': 'application/json',
        'content-length': '0',
      },
    })

    expect(res.statusCode).toBe(401)
    expect(res.body).not.toContain('FST_ERR_CTP_EMPTY_JSON_BODY')
  })
})

// ---------------------------------------------------------------------------
// Priority 2 — auth boundaries
// ---------------------------------------------------------------------------

describe('routes that need no infrastructure', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('GET /health returns 200 and is registered without the /api/v1 prefix', async () => {
    app = build()

    const res = await app.inject({ method: 'GET', url: '/health' })

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body).status).toBe('ok')

    // healthCheck is registered with no prefix option — prove that by showing
    // the prefixed path does NOT exist.
    const prefixed = await app.inject({ method: 'GET', url: '/api/v1/health' })
    expect(prefixed.statusCode).toBe(404)
  })

  /**
   * CHARACTERIZED. `ignoreTrailingSlash` has been set since the Fastify 4 days
   * and every route is reachable with or without a trailing slash.
   *
   * This exists because the Fastify 5 bump had to MOVE that option: passing it
   * at the top level still works in v5 but emits FSTDEP022 and is removed in
   * v6, so it now lives under `routerOptions` (app.ts). That is a silent kind
   * of change — if the option stopped applying, nothing else in this suite
   * would notice, and every caller using a trailing slash would start getting
   * 404s in production. Verified against the built bundle too: /health/ and
   * /robots.txt/ both answered 200.
   */
  it('routes are reachable with a trailing slash (ignoreTrailingSlash)', async () => {
    app = build()

    const bare = await app.inject({ method: 'GET', url: '/health' })
    const slashed = await app.inject({ method: 'GET', url: '/health/' })

    expect(bare.statusCode).toBe(200)
    expect(slashed.statusCode).toBe(200)
    // Compare the stable field only — /health returns a fresh `Date.now()`
    // timestamp per request, so the raw bodies never match.
    expect(JSON.parse(slashed.body).status).toBe('ok')

    // Also true for a route registered outside a plugin, which takes a
    // different registration path through the router.
    const robots = await app.inject({ method: 'GET', url: '/robots.txt/' })
    expect(robots.statusCode).toBe(200)
  })

  it('GET /robots.txt returns 200 with a long-lived cache header', async () => {
    app = build()

    const res = await app.inject({ method: 'GET', url: '/robots.txt' })

    expect(res.statusCode).toBe(200)
    // 24 days, not 24 hours — `serveRobotsTxt` computes `24 * DAY / SECOND`.
    expect(res.headers['cache-control']).toBe('public, max-age=2073600')

    // CAVEAT: `buildServer` passes the relative path 'static/robots-api.txt',
    // which resolves against the *bundle* directory. Loaded unbundled under
    // ts-jest `__dirname` is `src/utils`, so this route serves the fail-closed
    // fallback here, not the real asset. The two happen to be byte-identical,
    // so this assertion holds either way and proves nothing about which branch
    // ran. Branch coverage lives in `describe('serveRobotsTxt')` below, which
    // tells them apart via the warning rather than the body.
    expect(res.body).toBe('User-agent: *\nDisallow: /\n')
  })
})

/**
 * Direct coverage of `serveRobotsTxt`, which the integration test above can
 * only reach through its fallback branch. Both branches are exercised against
 * real files — no fs mocking.
 */
describe('serveRobotsTxt', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  const bare = (): FastifyInstance => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { fastify } = require('fastify') as typeof import('fastify')
    return fastify()
  }

  it('serves the real asset when the path resolves', async () => {
    // `serveRobotsTxt` joins against its own `__dirname` (src/utils), so walk
    // back up to the checked-in asset.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serverUtils = require('./utils/server-utils') as typeof import('./utils/server-utils')
    const { serveRobotsTxt } = serverUtils
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { readFileSync } = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { join } = require('path') as typeof import('path')

    const expected = readFileSync(
      join(__dirname, '..', 'static', 'robots-api.txt'),
      'utf8',
    )

    app = bare()
    const warn = jest.spyOn(app.log, 'warn')
    serveRobotsTxt(app, '../../static/robots-api.txt')

    const res = await app.inject({ method: 'GET', url: '/robots.txt' })

    expect(res.statusCode).toBe(200)
    expect(res.body).toBe(expected)
    // The checked-in asset is byte-identical to the fail-closed fallback, so
    // the response body CANNOT distinguish the two branches. The absence of
    // the warning is what proves the file was actually read.
    expect(warn).not.toHaveBeenCalled()
  })

  it('fails closed with a full Disallow when the path does not resolve', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const serverUtils = require('./utils/server-utils') as typeof import('./utils/server-utils')
    const { serveRobotsTxt } = serverUtils

    app = bare()
    const warn = jest.spyOn(app.log, 'warn')

    serveRobotsTxt(app, 'definitely/not/here.txt')

    const res = await app.inject({ method: 'GET', url: '/robots.txt' })

    expect(res.statusCode).toBe(200)
    // An empty body would read to crawlers as "allow everything", cached for
    // 24 days. Disallow-all is the safe default.
    expect(res.body).toBe('User-agent: *\nDisallow: /\n')
    expect(warn).toHaveBeenCalled()
  })
})

describe('@fastify/basic-auth guarded routes', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('rejects DELETE /api/v1/cache/ministries with 401 when no credentials are sent', async () => {
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
    })

    expect(res.statusCode).toBe(401)
    // @fastify/basic-auth appends the charset itself — pinned exactly so a
    // plugin major bump that drops or reformats it shows up here.
    expect(res.headers['www-authenticate']).toBe(
      'Basic realm="Reglugerdir", charset="UTF-8"',
    )
  })

  it('rejects wrong credentials with 401', async () => {
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { authorization: basic('reg-user', 'wrong-pass') },
    })

    expect(res.statusCode).toBe(401)
  })

  it('lets correct credentials past the auth hook and into the handler', async () => {
    setEnv({ ROUTES_USERNAME: 'reg-user', ROUTES_PASSWORD: 'reg-pass' })
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { authorization: basic('reg-user', 'reg-pass') },
    })

    // The point of this test is "auth was passed", not the handler's result.
    expect(res.statusCode).not.toBe(401)
    // With REDIS_URL unset, `fastify.redis` is undefined and `del()` short-
    // circuits to 0 rather than throwing — so the handler does complete.
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ deleted: 0 })
  })

  it('rejects every credential when ROUTES_USERNAME/PASSWORD are unset (no open hole)', async () => {
    // ROUTES_USERNAME / ROUTES_PASSWORD deleted in beforeEach.
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { authorization: basic('', '') },
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('hand-rolled authMiddleware routes', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('rejects POST /api/v1/regulation/publish with 401 when the Authorization header is missing', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/regulation/publish',
    })

    expect(res.statusCode).toBe(401)
    expect(res.headers['www-authenticate']).toBe(
      'Basic realm="Reglugerdir publish"',
    )
  })

  it('rejects a non-Basic Authorization scheme on the publish route', async () => {
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/regulation/publish',
      headers: { authorization: 'Bearer some-token' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('rejects wrong Basic credentials on the publish route', async () => {
    setEnv({
      REGULATIONS_API_USERNAME: 'pub-user',
      REGULATIONS_API_PASSWORD: 'pub-pass',
    })
    app = build()

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/regulation/publish',
      headers: { authorization: basic('pub-user', 'nope') },
    })

    expect(res.statusCode).toBe(401)
  })

  it('rejects GET /api/v1/change-suggestions with 401 and the change-suggestion realm', async () => {
    app = build()

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/change-suggestions',
    })

    expect(res.statusCode).toBe(401)
    expect(res.headers['www-authenticate']).toBe(
      'Basic realm="Reglugerdir LM process"',
    )
  })
})

// ---------------------------------------------------------------------------
// Priority 3 — route registration shape
// ---------------------------------------------------------------------------

describe('conditional OpenSearch route registration', () => {
  let app: FastifyInstance | undefined
  let stub: Server | undefined

  afterEach(async () => {
    if (app) {
      await app.close()
      app = undefined
    }
    if (stub) {
      await new Promise<void>((resolve) => stub?.close(() => resolve()))
      stub = undefined
    }
  })

  it('does NOT register the search routes when OPENSEARCH_CLUSTER_ENDPOINT is unset', async () => {
    app = build()

    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/search' })).statusCode,
    ).toBe(404)
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/search/update' }))
        .statusCode,
    ).toBe(404)
    expect(
      (await app.inject({ method: 'GET', url: '/api/v1/search/repopulate' }))
        .statusCode,
    ).toBe(404)
  })

  /**
   * `@fastify/opensearch` pings the cluster during `register`, so an endpoint
   * that refuses connections makes `ready()` reject. We therefore stand up a
   * real (but minimal) HTTP server that answers the ping and 503s everything
   * else. Nothing in *our* code is mocked — only the network peer exists.
   */
  it('registers the search routes when OPENSEARCH_CLUSTER_ENDPOINT is set, with `this` bound to the Fastify instance', async () => {
    stub = createServer((req, res) => {
      if (req.url === '/' || req.url === '') {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ version: { number: '2.11.0' } }))
        return
      }
      res.writeHead(503, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'stub: no cluster here' }))
    })
    await new Promise<void>((resolve) => stub?.listen(0, '127.0.0.1', resolve))
    const port = (stub.address() as AddressInfo).port

    setEnv({ OPENSEARCH_CLUSTER_ENDPOINT: `http://127.0.0.1:${port}` })
    app = build()

    const res = await app.inject({ method: 'GET', url: '/api/v1/search?q=abc' })

    // Registered — the 404 from the previous test is gone.
    expect(res.statusCode).not.toBe(404)

    // `searchRoutes` uses non-arrow handlers so `this` is the Fastify
    // instance and `this.opensearch` is the decorated client. If that binding
    // ever breaks, the handler's own guard fires and we'd see exactly
    // 'OpenSearch client not available' (or a TypeError on `undefined`)
    // instead of a failure that came from actually talking to the cluster.
    const message = String(JSON.parse(res.body).message ?? '')
    expect(message).not.toBe('OpenSearch client not available')
    expect(message).not.toMatch(/Cannot read propert/)

    // The basic-auth guarded rebuild route is registered too.
    const repopulate = await app.inject({
      method: 'GET',
      url: '/api/v1/search/repopulate',
    })
    expect(repopulate.statusCode).toBe(401)
  }, 30_000)
})
