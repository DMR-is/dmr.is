const { composePlugins, withNx } = require('@nx/next')
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')
const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: 'short',
  turbopackMode: 'on',
})
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    // '@@island.is/island-ui/core/*',
    // '@@island.is/island-ui/core',
    '@island.is/island-ui/core/hooks',
    '@island.is/island-ui/core/utils',
    '@island.is/island-ui/core/globalCss',
    '@island.is/island-ui/core/globalStyles',
    '@island.is/island-ui/theme',
    '@island.is/island-ui/utils',
    '@island.is/shared/utils',
    '@island.is/island-ui/vanilla-extract-utils',
    '@dmr.is/ui/components/island-is',
    '@island.is/island-ui/core/Box/useBoxStyles',
  ],
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
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
  typescript: {
    // ignoreBuildErrors: true,
  },
  env: {
    API_MOCKS: process.env.API_MOCKS || null,
    NEXTAUTH_URL:
      process.env.NODE_ENV !== 'production'
        ? `${process.env.LG_WEB_URL}/api/auth`
        : process.env.NEXTAUTH_URL || null,
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withVanillaExtract,
]

module.exports = composePlugins(...plugins)(nextConfig)
