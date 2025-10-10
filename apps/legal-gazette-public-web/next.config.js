const { composePlugins, withNx } = require('@nx/next')
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')
const withVanillaExtract = createVanillaExtractPlugin()
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

// Read port from project.json
const fs = require('fs')
const path = require('path')
const projectConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'project.json'), 'utf8'),
)
const port = projectConfig.targets?.serve?.options?.port || 4300

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false
    if (process.env.ANALYZE === 'true' && !isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: isServer
            ? '../analyze/server.html'
            : './analyze/client.html',
        }),
      )
    }

    return config
  },
  env: {
    API_MOCKS: process.env.API_MOCKS || '',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? `http://localhost:${port}`,
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withVanillaExtract,
]

module.exports = composePlugins(...plugins)(nextConfig)
