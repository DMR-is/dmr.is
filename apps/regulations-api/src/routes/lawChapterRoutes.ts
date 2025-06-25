/* eslint-disable no-console */
import { FastifyPluginCallback } from 'fastify';

import { getLawChapterList, getLawChapterTree } from '../db/LawChapter';
import { get, set } from '../utils/cache';
import { cacheControl, QStr } from '../utils/misc';
import { LawChapter, LawChapterSlug, LawChapterTree } from './types';

import { DAY, SECOND } from '@hugsmidjan/qj/time';

const LAWCHAPTER_TTL = 24;
const LAWCHAPTER_REDIS_TTL = 1 * (DAY / SECOND);

export const lawChapterRoutes: FastifyPluginCallback = (
  fastify,
  opts,
  done,
) => {
  /**
   * Gets all LawChapters sorted by slug
   * @param {string} slugs - Comma separated list of LawChapterSlug to filter
   * @returns {Array<LawChapter>}
   */
  fastify.get<QStr<'slugs'>>('/lawchapters', opts, async (req, res) => {
    const { redis } = fastify;

    const slugs = req.query.slugs
      ? (req.query.slugs.split(',') as Array<LawChapterSlug>)
      : undefined;

    const cacheKey = `lawchapters-${req.query.slugs ?? 'noslugs'}`;

    const cached = await get<Array<LawChapter> | null>(redis, cacheKey);

    let lawChapters;

    if (cached) {
      lawChapters = cached;
    } else {
      try {
        lawChapters = await getLawChapterList(slugs);
      } catch (e) {
        console.error('unable to get law chapters', slugs, e);
        return res.status(500).send();
      }
      set(redis, cacheKey, lawChapters, LAWCHAPTER_REDIS_TTL);
    }

    cacheControl(res, LAWCHAPTER_TTL);
    return res.send(lawChapters);
  });

  /**
   * Gets a tree containing all LawChapters sorted by slug
   * @returns {LawChapterTree}
   */
  fastify.get('/lawchapters/tree', opts, async (req, res) => {
    const { redis } = fastify;

    const cacheKey = `lawchapterstree`;

    const cached = await get<LawChapterTree | null>(redis, cacheKey);

    let lawChapterTree;

    if (cached) {
      lawChapterTree = cached;
    } else {
      try {
        lawChapterTree = await getLawChapterTree();
      } catch (e) {
        console.error('unable to get law chapter tree', e);
        return res.status(500).send();
      }
      set(redis, cacheKey, lawChapterTree, LAWCHAPTER_REDIS_TTL);
    }

    cacheControl(res, LAWCHAPTER_TTL);
    return res.send(lawChapterTree);
  });

  done();
};
