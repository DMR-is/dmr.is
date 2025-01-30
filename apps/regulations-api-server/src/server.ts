import { fastify as fast } from 'fastify'
import fastifyBasicAuth, { FastifyBasicAuthOptions } from 'fastify-basic-auth'
import fastifyCompress from 'fastify-compress'
import fastifyElasticsearch from 'fastify-elasticsearch'
import fastifyMultipart from 'fastify-multipart'
import fastifyRateLimiter from 'fastify-rate-limit'
import fastifyRedis, { FastifyRedisPluginOptions } from 'fastify-redis'

import { fileUploadRoutes } from './routes/fileUploadRoutes'
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

const { ROUTES_USERNAME, ROUTES_PASSWORD, PORT, REDIS_URL } = process.env

if (REDIS_URL) {
  console.info('redis active')
  const url = REDIS_URL

  const tls =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    (url.indexOf('rediss') ?? -1) >= 0
      ? {
          rejectUnauthorized: false,
        }
      : undefined

  const redisOptions: FastifyRedisPluginOptions = {
    url,
    closeClient: true,
    tls,
  }
  fastify.register(fastifyRedis, redisOptions)
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

const { ELASTIC_CLOUD_ID, ELASTIC_CLOUD_APIKEY_ID, ELASTIC_CLOUD_APIKEY_KEY } =
  process.env

if (ELASTIC_CLOUD_ID && ELASTIC_CLOUD_APIKEY_ID && ELASTIC_CLOUD_APIKEY_KEY) {
  fastify.register(fastifyElasticsearch, {
    cloud: {
      id: ELASTIC_CLOUD_ID,
    },
    auth: {
      apiKey: {
        id: ELASTIC_CLOUD_APIKEY_ID,
        api_key: ELASTIC_CLOUD_APIKEY_KEY,
      },
    },
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

serveRobotsTxt(fastify, '/static/robots-api.txt')

const start = async () => {
  try {
    connectSequelize()
    const serverPort = PORT || 3000

    await fastify.listen(serverPort, '0.0.0.0')

    console.info('API up and running on port ' + serverPort)
  } catch (err) {
    console.info(err)
    process.exit(1)
  }
}

start()
