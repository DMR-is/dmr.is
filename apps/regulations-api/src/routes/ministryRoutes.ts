import { FastifyPluginCallback } from 'fastify'

import { getAllMinistries } from '../db/Ministry'
import { MinistryAttributes } from '../models'
import { get, set } from '../utils/cache'
import { cacheControl, QStr } from '../utils/misc'
import { MinistryListItem, MinistrySlug } from './types'

import { DAY, SECOND } from '@hugsmidjan/qj/time'

const MINISTRY_TTL = 1
const MINISTRY_REDIS_TTL = 1 * (DAY / SECOND)

export const ministryRoutes: FastifyPluginCallback = (fastify, opts, done) => {
  /**
   * Gets all minitries
   * @param {string} slugs - Comma separated list of MinistrySlugs to filter
   * @returns {MinistryList}
   */
  fastify.get<QStr<'slugs'>>('/ministries', opts, async (req, res) => {
    const { redis } = fastify

    const slugs = req.query.slugs
      ? (req.query.slugs.split(',') as Array<MinistrySlug>)
      : undefined

    const cacheKey = `ministries-${req.query.slugs ?? 'noslugs'}`

    const cached = await get<Array<MinistryAttributes> | null>(redis, cacheKey)

    let data: Array<MinistryAttributes>

    if (cached) {
      data = cached
    } else {
      try {
        data = await getAllMinistries(slugs)
        set(redis, cacheKey, data, MINISTRY_REDIS_TTL)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('unable to get all ministries', e)
        return res.status(500).send()
      }
    }
    const ministries = data.map((m): MinistryListItem => {
      const { id, ...ministry } = m
      return ministry
    })
    cacheControl(res, MINISTRY_TTL)
    return res.send(ministries)
  })

  done()
}
