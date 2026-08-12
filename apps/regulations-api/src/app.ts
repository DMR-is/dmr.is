/* eslint-disable no-console */
import { fastify as fast, FastifyInstance } from 'fastify'

import { cacheRoutes } from './routes/cacheRoutes'
import { changeSuggestionRoutes } from './routes/changeSuggestionRoutes'
import { fileUploadRoutes } from './routes/fileUploadRoutes'
import { healthCheck } from './routes/health'
import { lawChapterRoutes } from './routes/lawChapterRoutes'
import { ministryRoutes } from './routes/ministryRoutes'
import { publishRoutes } from './routes/publishRoutes'
import { redirectsRoutes } from './routes/redirectsRoutes'
import { regulationRoutes } from './routes/regulationRoutes'
import { regulationsRoutes } from './routes/regulationsRoutes'
import {
  elasticRebuildRoutes,
  elasticSearchRoutes,
} from './routes/searchRoutes'
import { yearsRoutes } from './routes/yearsRoutes'
import { serveRobotsTxt } from './utils/server-utils'

import fastifyBasicAuth, { FastifyBasicAuthOptions } from '@fastify/basic-auth'
import fastifyCompress from '@fastify/compress'
import fastifyMultipart from '@fastify/multipart'
import FastifyOpenSearch from '@fastify/opensearch'
import fastifyRedis from '@fastify/redis'

// ===========================================================================
// Added comment to trigger redeploy

export function buildServer(): FastifyInstance {
  const fastify = fast({
    logger: true,
    // Fastify 5 moved the router options behind `routerOptions`. Passing
    // `ignoreTrailingSlash` at the top level still works but emits FSTDEP022
    // (see fastify/lib/route.js `buildRouterOptions`), and the top-level form
    // is removed in Fastify 6. Behaviour is identical — v5 merely copies the
    // top-level value into `routerOptions` when it is absent there.
    routerOptions: {
      ignoreTrailingSlash: true,
    },
  })

  const {
    ROUTES_USERNAME,
    ROUTES_PASSWORD,
    REDIS_URL,
    REDIS_PASSWORD,
    OPENSEARCH_CLUSTER_ENDPOINT,
  } = process.env

  if (REDIS_URL) {
    console.info('redis active')

    fastify.register(fastifyRedis, {
      host: REDIS_URL ?? '',
      port: 6379,
      password: REDIS_PASSWORD ?? '',
      tls: {
        rejectUnauthorized: false,
      },
    })
  }

  const validate: FastifyBasicAuthOptions['validate'] = (
    username,
    password,
    req,
    reply,
    done,
  ) => {
    if (
      ROUTES_USERNAME &&
      username === ROUTES_USERNAME &&
      ROUTES_PASSWORD &&
      password === ROUTES_PASSWORD
    ) {
      done()
    } else {
      done(new Error('Noop'))
    }
  }
  const authenticate = { realm: 'Reglugerdir' }
  fastify.register(fastifyBasicAuth, { validate, authenticate })

  if (process.env.PROXIED !== 'true') {
    fastify.register(fastifyCompress, { global: true })
  }

  if (!OPENSEARCH_CLUSTER_ENDPOINT) {
    console.warn(
      'No OpenSearch endpoint found. Search routes and elastic rebuild routes not enabled.',
    )
  }
  if (OPENSEARCH_CLUSTER_ENDPOINT) {
    // NOTE: @fastify/opensearch@2 declares `@opensearch-project/opensearch@^3.3.0`.
    // The root package.json pins that nested dependency back to the 2.13.x this
    // app uses, so `this.opensearch` and everything in `src/elastic/` share one
    // client version. Remove that resolution and the search routes silently get
    // a major-version-newer client as a side effect of a Fastify upgrade.
    fastify.register(FastifyOpenSearch, {
      node: OPENSEARCH_CLUSTER_ENDPOINT,
      ssl: { rejectUnauthorized: false },
      maxRetries: 5,
      requestTimeout: 120_000,
      compression: 'gzip',
      agent: { keepAlive: true, maxSockets: 10 },
    })
    fastify.register(elasticSearchRoutes, { prefix: '/api/v1' })
    fastify.register(elasticRebuildRoutes, { prefix: '/api/v1' })
  }

  // Decorates the request with `file()`, which POST /file-upload calls directly.
  // No `prefix` — the plugin registers no routes of its own, so a prefix was
  // always inert here. No `limits` either: the upload route sets its own
  // per-call `fileSize` (see `uploadFileFromRequest`), and adding a ceiling
  // here would be a behaviour change rather than part of this upgrade.
  fastify.register(fastifyMultipart)
  fastify.register(fileUploadRoutes, { prefix: '/api/v1' })

  fastify.register(regulationRoutes, { prefix: '/api/v1' })
  fastify.register(regulationsRoutes, { prefix: '/api/v1' })
  fastify.register(ministryRoutes, { prefix: '/api/v1' })
  fastify.register(lawChapterRoutes, { prefix: '/api/v1' })
  fastify.register(yearsRoutes, { prefix: '/api/v1' })
  fastify.register(redirectsRoutes, { prefix: '/api/v1' })
  fastify.register(changeSuggestionRoutes, { prefix: '/api/v1' })
  fastify.register(publishRoutes, { prefix: '/api/v1' })
  fastify.register(cacheRoutes, { prefix: '/api/v1' })
  fastify.register(healthCheck)

  serveRobotsTxt(fastify, 'static/robots-api.txt')

  return fastify
}
