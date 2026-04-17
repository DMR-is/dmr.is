const { composePlugins, withNx } = require('@nx/webpack')

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => {
    // @dmr.is/* workspace packages export TypeScript source and must be
    // bundled, not externalized. Wrap the externals to allow them through.
    if (Array.isArray(config.externals)) {
      config.externals = config.externals.map((ext) => {
        if (typeof ext !== 'function') return ext
        return (ctx, callback) => {
          if (ctx.request?.startsWith('@dmr.is/')) {
            return callback()
          }
          return ext(ctx, callback)
        }
      })
    }
    return config
  },
)
