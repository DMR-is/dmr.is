import { FastifyInstance } from 'fastify'
import { readFileSync } from 'fs'
import path from 'path'

import { DAY, SECOND } from '@hugsmidjan/qj/time'

export const serveRobotsTxt = (server: FastifyInstance, robotsFile: string) => {
  const robotsPath = path.join(__dirname, robotsFile)

  let robotsTxt = ''
  try {
    robotsTxt = readFileSync(robotsPath, 'utf8')
  } catch (err) {
    // In production the file is always copied next to the bundle (see
    // regulations-api's esbuild `assets` config), so this only happens when
    // this module is loaded unbundled (e.g. from a test) relative to a
    // different cwd/__dirname. Don't let that break server construction.
    console.warn('Could not read robots.txt at ' + robotsPath, err)
  }

  server.get('/robots.txt', (request, reply) => {
    reply
      .code(200)
      .headers({
        'Cache-Control': 'public, max-age=' + (24 * DAY) / SECOND,
      })
      .send(robotsTxt)
  })
}
