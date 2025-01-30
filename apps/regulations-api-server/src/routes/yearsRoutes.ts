import { FastifyPluginCallback } from 'fastify';

import { getRegulationsYears } from '../db/Regulations';
import { cacheControl } from '../utils/misc';

const YEARS_TTL = 1;

export const yearsRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  /**
   * Gets all minitries
   * @returns {Array<number>}
   */
  fastify.get('/years', opts, async (request, reply) => {
    const data = await getRegulationsYears();
    cacheControl(reply, YEARS_TTL);
    reply.send(data);
  });

  done();
};
