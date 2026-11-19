import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

// By relative path, as the parse-gate barrel asks: this is a separate gate with
// its own budget, not a second copy of the parse gate.
import { Semaphore, SemaphoreQueueFullError } from '../parse-gate/semaphore'
import { IReportPdfDownloadGate } from './report-pdf-download-gate.service.interface'

const LOGGING_CONTEXT = 'ReportPdfDownloadGate'

/** Log marker for a shed download, alertable like `EXCEL_IMPORT_BUSY`. */
export const REPORT_PDF_DOWNLOAD_BUSY = 'REPORT_PDF_DOWNLOAD_BUSY'

/** Each render launches its own Chromium. */
export const MAX_CONCURRENT_PDF_DOWNLOADS = 2

export const MAX_QUEUED_PDF_DOWNLOADS = 10

@Injectable()
export class ReportPdfDownloadGate implements IReportPdfDownloadGate {
  private readonly semaphore = new Semaphore(
    MAX_CONCURRENT_PDF_DOWNLOADS,
    MAX_QUEUED_PDF_DOWNLOADS,
  )

  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  async run<T>(render: () => Promise<T>): Promise<T> {
    let release: () => void

    try {
      release = await this.semaphore.acquire()
    } catch (error) {
      if (error instanceof SemaphoreQueueFullError) {
        this.logger.warn('Report PDF download shed — gate saturated', {
          context: LOGGING_CONTEXT,
          errorCode: REPORT_PDF_DOWNLOAD_BUSY,
          activeDownloads: this.semaphore.activeCount,
          queuedDownloads: this.semaphore.queuedCount,
        })
        throw new ServiceUnavailableException(
          'Ekki er hægt að sækja skjalið í augnablikinu. Reyndu aftur eftir smástund.',
        )
      }
      throw error
    }

    try {
      return await render()
    } finally {
      release()
    }
  }
}
