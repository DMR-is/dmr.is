const path = require('path')
const { composePlugins, withNx } = require('@nx/next')
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')
const withVanillaExtract = createVanillaExtractPlugin()
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
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

    const modules = path.resolve(__dirname, '../..', 'node_modules')

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@babel/runtime': path.resolve(modules, '@babel/runtime'),
      'bn.js': path.resolve(modules, 'bn.js'),
      'date-fns': path.resolve(modules, 'date-fns'),
      'es-abstract': path.resolve(modules, 'es-abstract'),
      'escape-string-regexp': path.resolve(modules, 'escape-string-regexp'),
      'readable-stream': path.resolve(modules, 'readable-stream'),
      'react-popper': path.resolve(modules, 'react-popper'),
      inherits: path.resolve(modules, 'inherits'),
      'graphql-tag': path.resolve(modules, 'graphql-tag'),
      'safe-buffer': path.resolve(modules, 'safe-buffer'),
      scheduler: path.resolve(modules, 'scheduler'),
    }

    return config
  },

  env: {
    API_MOCKS: process.env.API_MOCKS || '',
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withVanillaExtract,
]

module.exports = composePlugins(...plugins)(nextConfig)
