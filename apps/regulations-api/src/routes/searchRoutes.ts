import { FastifyPluginCallback } from 'fastify'

import { repopulateElastic, updateElasticItem } from '../elastic/populate'
import { searchElastic, SearchQueryParams } from '../elastic/search'
import { QStr } from '../utils/misc'

// ---------------------------------------------------------------------------

export const elasticSearchRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Search regulations
   * @returns RegulationSearchResults
   */
  fastify.get<{ Querystring: SearchQueryParams }>(
    '/search',
    opts,
    async function (request, reply) {
      if (!this.opensearch) {
        throw new Error('OpenSearch client not available')
      }
      const data = await searchElastic(this.opensearch, request.query)
      return reply.send(data)
    },
  )

  /**
   * Update single regulation in index by RegName
   * @returns {success: boolean>}
   */
  fastify.get<QStr<'name'>>(
    '/search/update',
    opts,
    async function (request, reply) {
      if (!this.opensearch) {
        throw new Error('OpenSearch client not available')
      }
      await updateElasticItem(this.opensearch, request.query)

      return reply.send({ success: true })
    },
  )

  done()
}

export const elasticRebuildRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Repopulate and Recreate regulations search index
   * Throws out the old and refills the index with shiny fresh regulations data.
   * @returns {success: boolean>}
   */
  fastify.get<QStr<'template'>>(
    '/search/repopulate',
    Object.assign({}, opts, {
      onRequest: fastify.basicAuth,
    }),
    async function (request, reply) {
      if (!this.opensearch) {
        throw new Error('OpenSearch client not available')
      }
      const data = await repopulateElastic(this.opensearch)
      return reply.send(data)
    },
  )

  done()
}
