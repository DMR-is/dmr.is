import { FastifyPluginCallback, FastifyReply, FastifyRequest } from 'fastify'

import {
  ChangeSuggestionCreateInput,
  ChangeSuggestionFilters,
  ChangeSuggestionStatus,
  ChangeSuggestionUpdateInput,
  createChangeSuggestion,
  deleteChangeSuggestion,
  getAllChangeSuggestions,
  getChangeSuggestion,
  startChangeSuggestionProcess,
  updateChangeSuggestion,
} from '../db/ChangeSuggestion'
import { RegName } from './types'

// ---------------------------------------------------------------------------

type Pms<T extends string = ''> = { Params: Record<T, string> }
type QStr<T extends string = ''> = { Querystring: Record<T, string> }
type Body<T> = { Body: T }

const handleError = (error: unknown, reply: FastifyReply) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  if (error instanceof Error && error.message.includes('not found')) {
    return reply.code(404).send({ error: errorMessage })
  }

  return reply.code(500).send({ error: errorMessage })
}

// ---------------------------------------------------------------------------

export const changeSuggestionRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  const authMiddleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const auth = request.headers.authorization
    if (!auth || !auth.startsWith('Basic ')) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Reglugerdir LM process"')
      throw new Error('Unauthorized')
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString()
    const [username, password] = credentials.split(':')

    if (
      username !== process.env.ROUTES_USERNAME_CHANGESUGGESTION ||
      password !== process.env.ROUTES_PASSWORD_CHANGESUGGESTION
    ) {
      reply
        .code(401)
        .header('WWW-Authenticate', 'Basic realm="Reglugerdir LM process"')
      throw new Error('Unauthorized')
    }
  }

  /**
   * Get all change suggestions with optional filters
   * GET /change-suggestions?regulationId=123&status=pending
   */
  /**
   * Get all change suggestions with optional filters and pagination
   * GET /change-suggestions?regulationId=123&status=pending&page=1&limit=20
   */
  fastify.get<
    QStr<'regulationId' | 'changingId' | 'status' | 'page' | 'limit'>
  >(
    '/change-suggestions',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const filters: ChangeSuggestionFilters = {}

        if (req.query.regulationId) {
          filters.regulationId = parseInt(req.query.regulationId, 10)
        }

        if (req.query.changingId) {
          filters.changingId = parseInt(req.query.changingId, 10)
        }

        if (req.query.status) {
          filters.status = req.query.status.includes(',')
            ? (req.query.status.split(',') as ChangeSuggestionStatus[])
            : (req.query.status as ChangeSuggestionStatus)
        }

        if (req.query.page) {
          filters.page = parseInt(req.query.page, 10)
        }

        if (req.query.limit) {
          filters.limit = parseInt(req.query.limit, 10)
        }

        const result = await getAllChangeSuggestions(filters)
        return reply.send(result)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Get a single change suggestion by ID
   * GET /change-suggestions/:id
   */
  fastify.get<Pms<'id'>>(
    '/change-suggestions/:id',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const id = parseInt(req.params.id, 10)
        const suggestion = await getChangeSuggestion(id)

        if (!suggestion) {
          return reply.code(404).send({ error: 'ChangeSuggestion not found' })
        }

        return reply.send(suggestion)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Create a new change suggestion
   * POST /change-suggestions
   */
  fastify.post<Body<ChangeSuggestionCreateInput>>(
    '/change-suggestions',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const suggestion = await createChangeSuggestion(req.body)
        return reply.code(201).send(suggestion)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Update an existing change suggestion
   * PUT /change-suggestions/:id
   */
  fastify.put<Pms<'id'> & Body<ChangeSuggestionUpdateInput>>(
    '/change-suggestions/:id',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const id = parseInt(req.params.id, 10)
        const suggestion = await updateChangeSuggestion(id, req.body)
        return reply.send(suggestion)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Delete a change suggestion
   * DELETE /change-suggestions/:id
   */
  fastify.delete<Pms<'id'>>(
    '/change-suggestions/:id',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const id = parseInt(req.params.id, 10)
        const result = await deleteChangeSuggestion(id)
        return reply.send(result)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  /**
   * Start change suggestion process
   * POST /change-suggestions/process
   */
  fastify.post<
    Body<{ baseRegulationName: RegName; amendingRegulationName: RegName }>
  >(
    '/change-suggestions/process',
    { onRequest: authMiddleware },
    async (req, reply) => {
      try {
        const suggestion = await startChangeSuggestionProcess(req.body)
        return reply.code(201).send(suggestion)
      } catch (error) {
        return handleError(error, reply)
      }
    },
  )

  done()
}
