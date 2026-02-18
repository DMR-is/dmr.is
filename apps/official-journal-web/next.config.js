const { composePlugins, withNx } = require('@nx/next')
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin')
const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: 'short',
  turbopackMode: 'on',
})

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false

    return config
  },
  output: 'standalone',
  env: {
    API_MOCKS: process.env.API_MOCKS || null,
    NEXTAUTH_URL:
      process.env.NODE_ENV !== 'production'
        ? `${process.env.OFFICIAL_JOURNAL_WEB_URL}/api/auth`
        : process.env.NEXTAUTH_URL || null,
  },
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withVanillaExtract,
]

module.exports = composePlugins(...plugins)(nextConfig)
