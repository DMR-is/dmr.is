/* eslint-disable no-console */
import { FastifyPluginCallback } from 'fastify';

import {
  IntPositive,
  RegulationOptionList,
} from '@island.is/regulations-tools/types';
import {
  ensurePosInt,
  ensureRegName,
  isNonNull,
} from '@island.is/regulations-tools/utils';

import {
  getAllRegulations,
  getNewestRegulations,
  getRegulationsCount,
  getRegulationsOptionsList,
  PER_PAGE,
  RegulationListItemFull,
} from '../db/Regulations';
import { get, set } from '../utils/cache';
import { cacheControl, loadData, QStr, storeData } from '../utils/misc';

import { DAY, SECOND } from '@hugsmidjan/qj/time';

const NEWEST_TTL = 0.5;
const NEWEST_REDIS_TTL = NEWEST_TTL * 60 * 60;

const OPTIONSLIST_TTL = 24;
const OPTIONSLIST_REDIS_TTL = 1 * (DAY / SECOND);

export const regulationsRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Gets latest regulations as paged array
   * @returns {Array<DB_Regulation>}
   */
  fastify.get<QStr<'page'>>('/regulations/newest', opts, async (req, res) => {
    const { redis } = fastify;

    const page = ensurePosInt(req.query.page || '') || (1 as IntPositive);

    const cacheKey = `regulations-newest-page-${page}`;
    const cached = await get<Array<RegulationListItemFull> | null>(
      redis,
      cacheKey,
    );

    let data: Array<RegulationListItemFull>;

    if (cached) {
      data = cached;
    } else {
      try {
        data = await getNewestRegulations({
          skip: (page - 1) * PER_PAGE,
          take: PER_PAGE,
        });
      } catch (e) {
        console.error('unable to get newest regulations', e);
        return res.status(500).send();
      }
      set(redis, cacheKey, data, NEWEST_REDIS_TTL);
    }

    let totalItems: number;

    const cacheKeyTotalItems = `regulations-total-items`;
    const cachedTotalItems = await get<number | null>(
      redis,
      cacheKeyTotalItems,
    );

    if (cachedTotalItems) {
      totalItems = cachedTotalItems;
    } else {
      try {
        totalItems = await getRegulationsCount();
        set(redis, cacheKeyTotalItems, totalItems, NEWEST_REDIS_TTL);
      } catch (e) {
        console.error('unable to get regulationsCount', e);
        // recoverable, set the totalItems to something large...
        totalItems = 1000;
      }
    }

    const totalPages = Math.ceil(totalItems / PER_PAGE);

    cacheControl(res, NEWEST_TTL);
    return res.send({
      page,
      perPage: PER_PAGE,
      totalPages,
      totalItems,
      data,
    });
  });

  // ---------------------------------------------------------------------------

  // Use-case: Fetch "gildandi stofnreglugerðir" full text
  // for Ísland.is's general-purpose site search index.
  fastify.get('/regulations/all/current/full', opts, async (req, res) => {
    let data = await loadData('backup-json/all-current-full.json');
    if (!data) {
      console.info('Fetching data from db');
      try {
        data = await getAllRegulations({ full: true });
      } catch (e) {
        console.error('unable to get all regulations full', e);
        return res.status(500).send();
      }
      storeData(data, 'backup-json/all-current-full.json');
    } else {
      console.info('Returning all-current-full data from file');
    }
    return res.send(data);
  });

  // Use-case Fetch *all* regluations, full text to feed into
  // Reglugerðasafn's special purpose search-engine
  fastify.get<QStr<'template'>>(
    '/regulations/all/extra',
    Object.assign({}, opts, {
      onRequest: fastify.basicAuth,
    }),
    async function (req, res) {
      let data = loadData('backup-json/all-extra.json');
      if (!data) {
        console.info('Fetching data from db');

        try {
          data = await getAllRegulations({
            extra: true,
            includeRepealed: true,
          });
          storeData(data, 'backup-json/all-extra.json');
        } catch (e) {
          console.error('unable to get all regulations extra', e);
          return res.status(500).send();
        }
      } else {
        console.info('Returning all-extra data from file');
      }
      return res.send(data);
    },
  );

  // Use-case: Fetch all base regulations with minimal data
  // for Ísland.is's regulation admin editor impacts registration
  fastify.get('/regulations/all/current/minimal', opts, async (req, res) => {
    let data = loadData('backup-json/all-current-minimal.json');
    if (!data) {
      console.info('Fetching data from db');
      try {
        data = await getAllRegulations();
        storeData(data, 'backup-json/all-current-minimal.json');
      } catch (e) {
        console.error('unable to get all regulations current minimal', e);
        return res.status(500).send();
      }
    } else {
      console.info('Returning all-current-minimal data from file');
    }
    return res.send(data);
  });

  /**
   * Use-case: Fetch RegulationOption[] by list of regName[]
   * for Ísland.is's regulation admin editor impacts registration
   * @param {string} names - Comma separated list of RegNames to filter
   * @returns {RegulationOptionList}
   */
  fastify.get<QStr<'names'>>(
    '/regulations/optionsList',
    opts,
    async (req, res) => {
      const { redis } = fastify;

      const names = req.query.names ? req.query.names.split(',') : [];

      const regNames = names
        .map((maybeName) => ensureRegName(maybeName))
        .filter(isNonNull);

      if (!regNames.length) {
        return [];
      }

      const cacheKey = `regulationsOptionsList-${regNames.join(',')}`;
      const cached = await get<RegulationOptionList | null>(redis, cacheKey);

      let optionsList;

      if (cached) {
        optionsList = cached;
      } else {
        try {
          optionsList = await getRegulationsOptionsList(regNames);
        } catch (e) {
          console.error('unable to get regulations optionsList', names, e);
          return res.status(500).send();
        }
        set(redis, cacheKey, optionsList, OPTIONSLIST_REDIS_TTL);
      }

      cacheControl(res, OPTIONSLIST_TTL);
      return res.send(optionsList);
    },
  );

  done();
};
