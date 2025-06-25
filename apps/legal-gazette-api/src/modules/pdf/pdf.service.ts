import { Inject, Injectable } from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { getBrowser } from './lib/browser'

@Injectable()
export class PdfService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async generatePdfFromHtml(html: string): Promise<Buffer> {
    const browers = await getBrowser()
    try {
      const page = await browers.newPage()

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      })

      const pdfBuffer = await page.pdf({
        format: 'A4',
      })

      await browers.close()
      return pdfBuffer
    } catch (error) {
      this.logger.warn('Failed to generate PDF', {
        context: 'PdfService',
        category: 'pdf-service',
        error: error,
      })

      throw error
    } finally {
      await browers.close()
    }
  }
}
