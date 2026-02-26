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

  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    resolveAlias: {
      'react-select': 'react-select/dist/react-select.esm.js',
      'react-select/creatable':
        'react-select/creatable/dist/react-select-creatable.esm.js',
      'react-select/async':
        'react-select/async/dist/react-select-async.esm.js',
      'react-select/animated':
        'react-select/animated/dist/react-select-animated.esm.js',
      'react-select/async-creatable':
        'react-select/async-creatable/dist/react-select-async-creatable.esm.js',
    },
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
