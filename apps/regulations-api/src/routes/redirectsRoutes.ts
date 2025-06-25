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
      return res.send(data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('unable to get redirects', e);
      return res.status(500).send();
    }
  });

  done();
};
