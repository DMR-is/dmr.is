import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { getBrowser } from '../report-pdf/lib/browser'
import { noticeStyles } from './templates/notice.css'
import { buildNoticeHtml, NoticeInput } from './templates/notice.template'
import { INoticePdfService } from './notice-pdf.service.interface'

const LOGGING_CONTEXT = 'NoticePdfService'

/**
 * Renders the served notices to PDF.
 *
 * Reuses `getBrowser()` from the report-pdf module and nothing else — a notice is
 * not a report render, and `ReportPdfService.generateReportPdf` needs a
 * `reportId` that by definition does not exist for these tiers.
 *
 * Called at **issuance** (from the reminder task), not from the Skjalaveita
 * callback: `getBrowser()` launches a fresh Chromium per call, which is the wrong
 * thing to put on a request island.is makes synchronously while a user waits.
 */
@Injectable()
export class NoticePdfService implements INoticePdfService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async render(input: NoticeInput): Promise<Buffer> {
    const html = buildNoticeHtml(input)

    const browser = await getBrowser()
    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: 'networkidle0' })
      await page.addStyleTag({ content: noticeStyles })

      const pdf = await page.pdf({ format: 'A4', printBackground: true })

      return Buffer.from(pdf)
    } catch (error) {
      this.logger.warn('Failed to render notice PDF', {
        context: LOGGING_CONTEXT,
        tier: input.tier,
        reportType: input.reportType,
        error,
      })
      throw error
    } finally {
      await browser.close()
    }
  }
}
