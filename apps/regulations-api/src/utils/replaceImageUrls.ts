import { asDiv } from '@dmr.is/regulations-tools/_cleanup/serverDOM'
import { FILE_SERVER } from '@dmr.is/regulations-tools/constants'
import type { HTMLText, RegName } from '@dmr.is/regulations-tools/types'

import { moveUrlsToFileServer } from './file-upload-urls'

/**
 * Moves the files a regulation's text links to onto the file server, and
 * rewrites the links to point at their new location.
 *
 * In-process port of `replaceImageUrls` from `@dmr.is/regulations-tools`,
 * which reaches the same `moveUrlsToFileServer` by POSTing to this API's own
 * `/file-upload-urls` route. Collects the same links: every `img` src, and
 * `a` hrefs already on the file server (e.g. draft uploads).
 *
 * The uploads themselves are fire-and-forget, as they are behind the route.
 */
export const replaceImageUrls = (
  text: HTMLText,
  regName: RegName,
): HTMLText => {
  const root = asDiv(text)

  const images = Array.from(root.querySelectorAll('img'))
  const links = Array.from(root.querySelectorAll('a')).filter((a) =>
    FILE_SERVER.endsWith('//' + a.host),
  )

  const urls = [
    ...images.map((img) => img.getAttribute('src')),
    ...links.map((a) => a.getAttribute('href')),
  ].filter((url): url is string => !!url)

  const newUrls = new Map(
    moveUrlsToFileServer(urls, regName).map(({ oldUrl, newUrl }) => [
      oldUrl,
      newUrl,
    ]),
  )

  images.forEach((img) => {
    const newUrl = newUrls.get(img.getAttribute('src') ?? '')
    newUrl && img.setAttribute('src', newUrl)
  })
  links.forEach((a) => {
    const newUrl = newUrls.get(a.getAttribute('href') ?? '')
    newUrl && a.setAttribute('href', newUrl)
  })

  return root.innerHTML as HTMLText
}
