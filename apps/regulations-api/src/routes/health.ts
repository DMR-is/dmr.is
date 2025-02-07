import { FastifyPluginCallback } from 'fastify'

export const healthCheck: FastifyPluginCallback = (fastify, opts, done) => {
  fastify.get('/health', opts, async (request, reply) => {
    return { status: 'ok', timestamp: Date.now() }
  })

  done()
}
