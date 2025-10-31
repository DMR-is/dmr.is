const { composePlugins, withNx } = require('@nx/next')
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')
const withVanillaExtract = createVanillaExtractPlugin()
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

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
    NEXTAUTH_URL: process.env.NODE_ENV !== 'production' ? `${process.env.LG_PUBLIC_WEB_URL}/api/auth` : process.env.NEXTAUTH_URL,
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withVanillaExtract,
]

module.exports = composePlugins(...plugins)(nextConfig)
