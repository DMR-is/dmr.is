import { DAY, SECOND } from '@hugsmidjan/qj/time'
import { FastifyInstance } from 'fastify'
import { readFileSync } from 'fs'
import path from 'path'

export const serveRobotsTxt = (server: FastifyInstance, robotsFile: string) => {
  const robotsTxt = readFileSync(
     path.resolve(__dirname, robotsFile)
  ).toString()

  server.get('/robots.txt', (requst, reply) => {
    reply
      .code(200)
      .headers({
        'Cache-Control': 'public, max-age=' + (24 * DAY) / SECOND,
      })
      .send(robotsTxt)
  })
}
