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
 * Fastify 5 rejects a request that declares `Content-Type: application/json`
 * but carries an empty body with `FST_ERR_CTP_EMPTY_JSON_BODY` (HTTP 400),
 * and it does so in the content-type parser — i.e. *after* `onRequest` in the
 * lifecycle, but Fastify 5 also made the empty-body check unconditional, so
 * bodyless JSON DELETEs that sail through today start 400ing.
 *
 * Both live DELETE routes are guarded by an `onRequest` hook, so on Fastify 4
 * an unauthenticated, bodyless `DELETE` is rejected by auth with 401 and the
 * body is never parsed. If either of these tests reports 400 /
 * `FST_ERR_CTP_EMPTY_JSON_BODY`, the upgrade changed the order in which a
 * client sees auth vs. body-parse failures — any caller that sends
 * `content-type: application/json` on a bodyless DELETE will break.
 */
describe('Fastify 5 canary: bodyless DELETE with content-type: application/json', () => {
  let app: FastifyInstance

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  it('DELETE /api/v1/cache/ministries is rejected by basic auth, not by the body parser', async () => {
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/cache/ministries',
      headers: { 'content-type': 'application/json' },
      // deliberately no payload
    })

    expect(res.statusCode).toBe(401)

    // Explicit negative assertions: this is the thing that flips on Fastify 5.
    expect(res.statusCode).not.toBe(400)
    expect(res.body).not.toContain('FST_ERR_CTP_EMPTY_JSON_BODY')
  })

  it('DELETE /api/v1/change-suggestions/:id is rejected by its auth hook, not by the body parser', async () => {
    app = build()

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/change-suggestions/123',
      headers: { 'content-type': 'application/json' },
      // deliberately no payload
    })

    expect(res.statusCode).toBe(401)

    expect(res.statusCode).not.toBe(400)
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

  it('GET /robots.txt returns 200 with a long-lived cache header', async () => {
    app = build()

    const res = await app.inject({ method: 'GET', url: '/robots.txt' })

    expect(res.statusCode).toBe(200)
    // 24 days, not 24 hours — `serveRobotsTxt` computes `24 * DAY / SECOND`.
    expect(res.headers['cache-control']).toBe('public, max-age=2073600')
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
