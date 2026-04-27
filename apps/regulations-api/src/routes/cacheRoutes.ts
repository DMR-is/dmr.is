import { FastifyPluginCallback } from 'fastify'

import { del } from '../utils/cache'

export const cacheRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  /**
   * Clears all cached ministry entries (matches `ministries-*`).
   * @returns {{ deleted: number }}
   */
  fastify.delete(
    '/cache/ministries',
    Object.assign({}, opts, {
      onRequest: fastify.basicAuth,
    }),
    async (req, res) => {
      const { redis } = fastify
      const deleted = await del(redis, 'ministries-*')
      return res.send({ deleted })
    },
  )

  done()
}
