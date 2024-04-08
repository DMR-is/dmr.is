const { exec } = require('./utils')

/**
 * Because get-files-touched-by.sh cannot get files from nx cache
 * we skip the cache on PR and Push pipelines
 */
const skipCache = process.argv && process.argv[2] === '--skip-cache'

/**
 * See https://docs.devland.is/repository/codegen about setting up your project with auto-generated API schema and client files
 */
const TARGETS = ['codegen']

const main = async () => {
  for (const target of TARGETS) {
    console.log(`--> Running command for ${target}\n`)

    try {
      await exec(
        `nx run-many --target=${target} --all --parallel --maxParallel=6 $NX_OPTIONS`,
        {
          env: skipCache
            ? { ...process.env, NX_OPTIONS: '--skip-nx-cache' }
            : process.env,
        },
      )
    } catch (err) {
      console.error(`Error running command: ${err.message}`)
      process.exit(err.code || 1)
    }
  }
}

main()
