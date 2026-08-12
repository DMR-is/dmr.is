import { FastifyInstance } from 'fastify'
import { readFileSync } from 'fs'
import path from 'path'

import { DAY, SECOND } from '@hugsmidjan/qj/time'

export const serveRobotsTxt = (server: FastifyInstance, robotsFile: string) => {
  const robotsPath = path.join(__dirname, robotsFile)

  // Fail closed: if the real file can't be read, disallow everything rather
  // than default to an empty body, which crawlers read as "allow everything"
  // — and this response is cached for 24 days, so a wrong default sticks.
  let robotsTxt = 'User-agent: *\nDisallow: /\n'
  try {
    robotsTxt = readFileSync(robotsPath, 'utf8')
  } catch (err) {
    // In production the file is always copied next to the bundle (see
    // regulations-api's esbuild `assets` config), so this only happens when
    // this module is loaded unbundled (e.g. from a test) relative to a
    // different cwd/__dirname. Don't let that break server construction.
    server.log.warn({ err, robotsPath }, 'Could not read robots.txt')
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
