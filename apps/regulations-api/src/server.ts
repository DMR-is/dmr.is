/* eslint-disable no-console */
import { cleanupPdfTempDir, logRenderToolchain } from './db/RegulationPdf'
import { connectSequelize } from './utils/sequelize'
import { buildServer } from './app'

const start = async () => {
  try {
    const fastify = buildServer()

    // Reclaim disk from any PDF temp artifacts left behind by a previous
    // process (e.g. Chromium profile dirs from timed-out/crashed renders).
    await cleanupPdfTempDir()

    // Record which Chromium/pagedjs-cli this image ended up with — neither is
    // pinned, so a rebuild can change the renderer without a code change.
    logRenderToolchain()

    connectSequelize()

    const serverPort = Number(process.env.PORT) || 3000

    await fastify.listen({ port: serverPort, host: '0.0.0.0' })

    console.info('API up and running on port ' + serverPort)
  } catch (err) {
    console.info(err)
    process.exit(1)
  }
}

start()
