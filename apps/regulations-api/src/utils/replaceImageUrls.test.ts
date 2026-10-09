import { FILE_SERVER } from '@dmr.is/regulations-tools/constants'
import type { HTMLText, RegName } from '@dmr.is/regulations-tools/types'

const moveUrlsToFileServer = jest.fn()
jest.mock('./file-upload-urls', () => ({
  moveUrlsToFileServer: (...args: unknown[]) => moveUrlsToFileServer(...args),
}))

import { replaceImageUrls } from './replaceImageUrls'

const regName = '0002/2021' as RegName
const draftFile = `${FILE_SERVER}/admin-drafts/skjal.pdf`

describe('replaceImageUrls', () => {
  beforeEach(() => {
    moveUrlsToFileServer.mockReset()
    moveUrlsToFileServer.mockImplementation((urls: string[]) =>
      urls.map((oldUrl) => ({ oldUrl, newUrl: `${oldUrl}-nytt` })),
    )
  })

  it('moves every image and file-server link under the regulation name', () => {
    const html = [
      '<p><img src="https://example.com/mynd.png" alt=""></p>',
      `<p><a href="${draftFile}">skjal</a></p>`,
      '<p><a href="https://example.com/sida">ytri hlekkur</a></p>',
    ].join('') as HTMLText

    const result = replaceImageUrls(html, regName)

    expect(moveUrlsToFileServer).toHaveBeenCalledWith(
      ['https://example.com/mynd.png', draftFile],
      regName,
    )
    expect(result).toContain('src="https://example.com/mynd.png-nytt"')
    expect(result).toContain(`href="${draftFile}-nytt"`)
    expect(result).toContain('href="https://example.com/sida"')
  })

  it('leaves links the mapper skips untouched', () => {
    moveUrlsToFileServer.mockReturnValue([])
    const html = '<p><img src="https://example.com/mynd.png" alt=""></p>'

    expect(replaceImageUrls(html as HTMLText, regName)).toBe(html)
  })

  it('returns text without links unchanged', () => {
    const html = '<p>Texti</p>' as HTMLText

    expect(replaceImageUrls(html, regName)).toBe(html)
  })
})
