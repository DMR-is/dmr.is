import type { HTMLText } from '@dmr.is/regulations-tools/types'

/**
 * Drops `<ins>`/`<del>` marks with nothing but newlines inside, as getDiff
 * did and regulations-api still does (`src/utils/diff.ts`). getStructuredDiff
 * can emit them from its word diff, e.g. between table rows, and diff styling
 * draws each one as a visible coloured sliver.
 */
export const dropEmptyDiffMarks = (html: HTMLText): HTMLText =>
  html
    .replace(/<del [^>]+>\n*<\/del>/g, '')
    .replace(/<ins [^>]+>\n*<\/ins>/g, '') as HTMLText
