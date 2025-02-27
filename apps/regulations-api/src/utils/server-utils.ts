import { DAY, SECOND } from '@hugsmidjan/qj/time'
import { FastifyInstance } from 'fastify'
import { readFileSync } from 'fs'
import path from 'path'

export const serveRobotsTxt = (server: FastifyInstance, robotsFile: string) => {
  const robotsPath = path.join(__dirname, robotsFile)
  const robotsTxt = readFileSync(robotsPath, 'utf8')

  server.get('/robots.txt', (request, reply) => {
    reply
      .code(200)
      .headers({
        'Cache-Control': 'public, max-age=' + (24 * DAY) / SECOND,
      })
      .send(robotsTxt)
  })
}
