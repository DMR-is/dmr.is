import { Inject, Injectable } from '@nestjs/common'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { getDoeNoticesBucket } from '@dmr.is/utils-server/serverUtils'

import { noticeObjectKey } from './lib/document-id'
import { INoticeStoreService } from './notice-store.service.interface'

const LOGGING_CONTEXT = 'NoticeStoreService'

/**
 * Stores and retrieves the PDF notices served into the island.is mailbox.
 *
 * The store exists so a notice is rendered exactly once, at issuance. Two
 * reasons, either of which is sufficient:
 *
 *  - Re-rendering on each callback would run a fresh Chromium inside a request
 *    island.is makes synchronously.
 *  - Live data drifts after issuance — `report-workflow.service.ts` advances the
 *    company's next due date on approval, and `company-import.service.ts`
 *    rewrites name and address from RSK. A re-render would silently restate a
 *    legal notice with facts that were never served.
 *
 * No table is needed: the object key is derived from the documentId, which is
 * itself derived. `company_event` remains the record of what was issued.
 */
@Injectable()
export class NoticeStoreService implements INoticeStoreService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  async put(
    nationalId: string,
    documentId: string,
    pdf: Buffer,
  ): Promise<void> {
    const key = noticeObjectKey(nationalId, documentId)

    // Derived key, so a retry after a failed registration overwrites rather than
    // accumulating orphans.
    ;(
      await this.aws.uploadObject(
        getDoeNoticesBucket(),
        key,
        `${documentId}.pdf`,
        pdf,
      )
    ).unwrap()

    this.logger.info('Stored mailbox notice', {
      context: LOGGING_CONTEXT,
      documentId,
      bytes: pdf.length,
    })
  }

  async get(nationalId: string, documentId: string): Promise<Buffer | null> {
    const key = noticeObjectKey(nationalId, documentId)

    try {
      return (
        await this.aws.getObjectBuffer(key, getDoeNoticesBucket())
      ).unwrap()
    } catch (error) {
      // A missing object is an expected outcome, not a fault: it means the
      // notice was never stored. Distinguishing it from a real S3 failure would
      // need the error shape, which the shared wrapper does not preserve — so
      // this is logged at warn and answered as "not found" upstream.
      this.logger.warn('Could not read mailbox notice from storage', {
        context: LOGGING_CONTEXT,
        documentId,
        error,
      })
      return null
    }
  }
}
