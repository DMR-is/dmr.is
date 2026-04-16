import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify'

import {
  hasPendingTasks,
  publishRegulation,
  PublishRegulationInput,
} from '../db/Publish'

// ---------------------------------------------------------------------------

type Pms<T extends string = ''> = { Params: Record<T, string> }
type Body<T> = { Body: T }

const handleError = (error: unknown, reply: FastifyReply) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  if (error instanceof Error && error.message.includes('already exists')) {
    return reply.code(409).send({ error: errorMessage })
  }

  if (error instanceof Error && error.message.includes('not found')) {
    return reply.code(404).send({ error: errorMessage })
  }

  return reply.code(500).send({ error: errorMessage })
}

// ---------------------------------------------------------------------------

export const publishRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  const authMiddleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const auth = request.headers.authorization
    if (!auth || !auth.startsWith('Basic ')) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Reglugerdir publish"')
      throw new Error('Unauthorized')
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString()
    const [username, password] = credentials.split(':')

    if (
      username !== process.env.REGULATIONS_API_USERNAME ||
      password !== process.env.REGULATIONS_API_PASSWORD
    ) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Reglugerdir publish"')
      throw new Error('Unauthorized')
    }
  }

  /**
   * Publish a regulation directly to the regulation database.
   * POST /regulation/publish
   */
  fastify.post<Body<PublishRegulationInput>>(
    '/regulation/publish',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const result = await publishRegulation(req.body)
        return reply.code(201).send(result)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Check if a base regulation has pending (undone) tasks.
   * GET /regulation/:name/pending-tasks
   *
   * The :name param uses RegName format "NNNN/YYYY" but the slash
   * is URL-encoded, so it arrives as a single param.
   * Callers should URL-encode the name (e.g. "0665%2F2020").
   */
  fastify.get<Pms<'name'>>(
    '/regulation/:name/pending-tasks',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const name = decodeURIComponent(req.params.name)
        const result = await hasPendingTasks(name)
        return reply.send(result)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  done()
}
