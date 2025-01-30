import { FastifyPluginCallback } from 'fastify';

import {
  recreateElastic,
  repopulateElastic,
  updateElasticItem,
} from '../elastic/populate';
import { searchElastic, SearchQueryParams } from '../elastic/search';
import { QStr } from '../utils/misc';

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
      const data = await searchElastic(this.elastic, request.query);
      reply.send(data);
    },
  );

  /**
   * Update single regulation in index by RegName
   * @returns {success: boolean>}
   */
  fastify.get<QStr<'name'>>(
    '/search/update',
    opts,
    async function (request, reply) {
      await updateElasticItem(this.elastic, request.query);

      reply.send({ success: true });
    },
  );

  done();
};

export const elasticRebuildRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Recreate regulations search index
   * Does **not** populate it with any regulations or other data
   * @returns {success: boolean>}
   */
  fastify.get<QStr<'template'>>(
    '/search/recreate',
    Object.assign({}, opts, {
      onRequest: fastify.basicAuth,
    }),
    async function (request, reply) {
      const data = await recreateElastic(this.elastic);
      reply.send(data);
    },
  );

  /**
   * Repopulate regulations search index
   * Throws out the old and refills the index with shiny fresh regulations data.
   * @returns {success: boolean>}
   */
  fastify.get<QStr<'template'>>(
    '/search/repopulate',
    Object.assign({}, opts, {
      onRequest: fastify.basicAuth,
    }),
    async function (request, reply) {
      const data = await repopulateElastic(this.elastic);
      reply.send(data);
    },
  );

  done();
};
