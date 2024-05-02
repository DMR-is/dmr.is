import { readFileSync } from 'fs'
import path from 'path'
import type { Browser } from 'puppeteer'
import puppeteer from 'puppeteer'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import dirtyClean from '@island.is/regulations-tools/dirtyClean-server'
import { HTMLText } from '@island.is/regulations-tools/types'

import { IPdfService } from './pdf.service.interface'

const LOGGING_CATEGORY = 'PdfService'

@Injectable()
export class PdfService implements IPdfService {
  browser: Browser | null = null
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {
    this.logger.info('Using PdfService', {
      category: LOGGING_CATEGORY,
    })
    this.initialize()
  }
  async generatePdfFromHtml(html: string, isLegacy = false): Promise<Buffer> {
    if (!this.browser) {
      throw new InternalServerErrorException()
    }

    this.logger.info(`Generating pdf`, {
      category: LOGGING_CATEGORY,
    })

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    // add the css

    const CSS = readFileSync(path.join(__dirname, '/pdf.css'))

    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${CSS}
      </style>
    </head>
    <body>
      ${isLegacy ? dirtyClean(html as HTMLText) : html}
    </body>
    </html>
    `

    console.log(htmlTemplate)

    await page.setContent(
      isLegacy ? dirtyClean(htmlTemplate as HTMLText) : htmlTemplate,
    )
    const pdf = await page.pdf()

    await browser.close()

    return pdf
  }
  private async initialize() {
    this.browser = await puppeteer.launch()

    this.logger.info('Puppeteer browser initialized', {
      category: LOGGING_CATEGORY,
    })
  }
}
