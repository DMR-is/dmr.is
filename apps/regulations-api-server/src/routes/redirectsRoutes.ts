import { FastifyPluginCallback } from 'fastify';

import { getRegulationsRedirects } from '../db/RegulationsRedirects';
import { cacheControl } from '../utils/misc';

const REDIRECTS_TTL = 1;

export const redirectsRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  /**
   * Gets all redirects
   * @returns Redirects
   */
  fastify.get('/redirects', opts, async (req, res) => {
    try {
      const data = await getRegulationsRedirects();
      cacheControl(res, REDIRECTS_TTL);
      res.send(data);
    } catch (e) {
      console.error('unable to get redirects', e);
      res.status(500).send();
    }
  });

  done();
};
