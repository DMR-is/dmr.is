import { execute as htmldiff } from '@dmr.is/regulations-tools/htmldiff-js'
import getStructuredDiff from '@dmr.is/regulations-tools/structuredDiff-server'

import { HTMLText, PlainText } from '../routes/types'

/**
 * Diffs two versions of regulation HTML (text, comments or an appendix).
 *
 * Structure-aware: articles and paragraphs are aligned as whole units before
 * any word is compared, so a new paragraph shows as one insertion instead of
 * being smeared over its neighbours. The markup is htmldiff's
 * (`<ins class="diffins">` etc.) plus `data-diff-*` annotations, and is always
 * well-nested.
 */
export const getHtmlDiff = (older: HTMLText, newer: HTMLText): HTMLText =>
  older === newer ? newer : getStructuredDiff(older, newer).diff

const toHTML = (textContent: PlainText) =>
  textContent.replace(/>/g, '&gt;') as HTMLText

/**
 * Word diff of two plain-text values, such as titles. They have no structure
 * to align, so this stays on htmldiff.
 *
 * regulations-tools' own `getTextContentDiff` does the same, but its module
 * also exports a React component and loads `react`, which this API does not
 * ship.
 */
export const getTextContentDiff = (
  older: PlainText,
  newer: PlainText,
): HTMLText =>
  older === newer
    ? toHTML(newer)
    : (htmldiff(toHTML(older), toHTML(newer))
        .replace(/<del [^>]+>\n*<\/del>/g, '')
        .replace(/<ins [^>]+>\n*<\/ins>/g, '') as HTMLText)
