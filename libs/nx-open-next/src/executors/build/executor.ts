import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nx/devkit'
import { NextBuildBuilderOptions } from '@nx/next'

import { OpenNextBuildExecutorSchema } from './schema'
import { runCommandProcess } from '../../utils/command'

export default async function openNextBuildExecutor(
  options: OpenNextBuildExecutorSchema,
  context: ExecutorContext,
) {
  if (!context.projectGraph) {
    throw new Error('Cannot find project graph')
  }

  try {
    const targetString = parseTargetString(
      options.buildTarget,
      context.projectGraph,
    )
    const buildOptions = readTargetOptions<NextBuildBuilderOptions>(
      targetString,
      context,
    )

    // The Next.js build is usually executed by Nx from the dependsOn in the project.json
    const buildCommand = options.buildCommand || 'exit 0'
    const openNextBuildCommand = `open-next build --build-command "${buildCommand}" --build-output-path "${buildOptions.outputPath}" --app-path "${options.sourceRoot}" --minify`
    const success = await runCommandProcess(openNextBuildCommand, context.root)

    // These commands are essentially because of an issue with the open-next build not handling paths correctly
    // and referencing the wrong path for the .next folder in some cases.
    // Attempts for fixing this properly were made, but it did not seem possible.
    // Hence the directory is copied to exist in both locations, `dist/` and `dist/dist/`.
    const mkdirCommand = `mkdir -p ${buildOptions.outputPath}/.open-next/server-function/dist/dist/apps/official-journal-web`
    await runCommandProcess(mkdirCommand, context.root)

    const copyCommand = `cp -r ${buildOptions.outputPath}/.open-next/server-function/dist/apps/official-journal-web/.next ${buildOptions.outputPath}/.open-next/server-function/dist/dist/apps/official-journal-web`
    await runCommandProcess(copyCommand, context.root)

    return {
      success,
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)

    return {
      success: false,
    }
  }
}
