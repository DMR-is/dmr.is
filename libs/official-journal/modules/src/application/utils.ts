import mammoth from 'mammoth'

import { simpleSanitize } from '@dmr.is/utils-server/cleanLegacyHtml'
export const wordBufferToHtml = async (buffer: Buffer): Promise<string> => {
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(async function (element) {
        const imageBuffer = await element.read('base64')
        return {
          src: 'data:' + element.contentType + ';base64,' + imageBuffer,
        }
      }),
    },
  )

  const htmlText = simpleSanitize(result.value)
  return htmlText
}
