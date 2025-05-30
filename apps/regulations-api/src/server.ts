/* eslint-disable no-console */
import { fastify as fast } from 'fastify'

import { fileUploadRoutes } from './routes/fileUploadRoutes'
import { healthCheck } from './routes/health'
import { lawChapterRoutes } from './routes/lawChapterRoutes'
import { ministryRoutes } from './routes/ministryRoutes'
import { redirectsRoutes } from './routes/redirectsRoutes'
import { regulationRoutes } from './routes/regulationRoutes'
import { regulationsRoutes } from './routes/regulationsRoutes'
import {
  elasticRebuildRoutes,
  elasticSearchRoutes,
} from './routes/searchRoutes'
import { yearsRoutes } from './routes/yearsRoutes'
import { connectSequelize } from './utils/sequelize'
import { serveRobotsTxt } from './utils/server-utils'

import fastifyBasicAuth, { FastifyBasicAuthOptions } from '@fastify/basic-auth'
import fastifyCompress from '@fastify/compress'
import fastifyMultipart from '@fastify/multipart'
import FastifyOpenSearch from '@fastify/opensearch'
import fastifyRateLimiter from '@fastify/rate-limit'
import fastifyRedis from '@fastify/redis'

// ===========================================================================

const fastify = fast({
  logger: true,
  ignoreTrailingSlash: true,
  // rewriteUrl: (req) => {
  //   console.log('FOOBAR', { url: req.url });
  //   return req.url || '/';
  // },
})
fastify.register(fastifyRateLimiter, {
  max: 100,
  timeWindow: '1 minute',
})

const { ROUTES_USERNAME, ROUTES_PASSWORD, PORT, REDIS_URL, REDIS_PASSWORD } = process.env

if (REDIS_URL) {
  console.info('redis active')

  fastify.register(fastifyRedis, {
    host: REDIS_URL ?? '',
    port: 6379,
    password: REDIS_PASSWORD ?? '',
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

const OPENSEARCH_CLUSTER_ENDPOINT = process.env.OPENSEARCH_CLUSTER_ENDPOINT

if (OPENSEARCH_CLUSTER_ENDPOINT) {
  fastify.register(FastifyOpenSearch, {
    node: OPENSEARCH_CLUSTER_ENDPOINT,
    healthcheck: false,
  })
  fastify.register(elasticSearchRoutes, { prefix: '/api/v1' })
  fastify.register(elasticRebuildRoutes, { prefix: '/api/v1' })
}

fastify.register(fastifyMultipart, { prefix: '/api/v1' }) // Required for fastify-multer to work
fastify.register(fileUploadRoutes, { prefix: '/api/v1' })

fastify.register(regulationRoutes, { prefix: '/api/v1' })
fastify.register(regulationsRoutes, { prefix: '/api/v1' })
fastify.register(ministryRoutes, { prefix: '/api/v1' })
fastify.register(lawChapterRoutes, { prefix: '/api/v1' })
fastify.register(yearsRoutes, { prefix: '/api/v1' })
fastify.register(redirectsRoutes, { prefix: '/api/v1' })
fastify.register(healthCheck)

serveRobotsTxt(fastify, 'static/robots-api.txt')

const start = async () => {
  try {
    connectSequelize()
    const serverPort = PORT || 3000

    fastify.listen({port: 3000, host: '0.0.0.0'})

    console.info('API up and running on port ' + serverPort)
  } catch (err) {
    console.info(err)
    process.exit(1)
  }
}

start()
