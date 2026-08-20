import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import {
  CompanyDeadlineReminderEventType,
  CompanyEventTypeEnum,
  CompanyReminderTierEnum,
} from '../company/models/company-event.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { ReportTypeEnum } from '../report/models/report.enums'
import { PostholfDocumentDto } from './dto/postholf-document.dto'
import {
  documentIdMatchesCompany,
  parseNoticeDocumentId,
} from './lib/document-id'
import { INoticeStoreService } from './notice-store.service.interface'
import { IPostholfDocumentService } from './postholf-document.service.interface'

const LOGGING_CONTEXT = 'PostholfDocumentService'

/**
 * The issuance event type per report kind. Mirrors `DEADLINE_KINDS` in the
 * reminder task — this is the other half of the same contract, so the two must
 * name the same event types.
 */
const MAILBOX_EVENT_TYPE: Record<
  ReportTypeEnum,
  CompanyDeadlineReminderEventType
> = {
  [ReportTypeEnum.EQUALITY]: CompanyEventTypeEnum.EQUALITY_MAILBOX_NOTICE_SENT,
  [ReportTypeEnum.SALARY]: CompanyEventTypeEnum.SALARY_MAILBOX_NOTICE_SENT,
}

/**
 * Serves a stored notice back to island.is on request.
 *
 * Implements the authorisation half of the Pósthólf security checklist:
 *
 *  1. the kennitala must be well-formed;
 *  2. the documentId must be one of ours and internally valid;
 *  3. the documentId's fingerprint must match the kennitala **from the request
 *     path** — never the id alone;
 *  4. a `company_event` proving we issued that exact notice must exist;
 *  5. only then is the stored object read.
 *
 * Every failure past step 1 answers 404 with the same message. Distinguishing
 * "no such company" from "never issued" would turn this endpoint into an oracle
 * for which companies have been served a legal notice.
 */
@Injectable()
export class PostholfDocumentService implements IPostholfDocumentService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(ICompanyEventService)
    private readonly companyEventService: ICompanyEventService,
    @Inject(INoticeStoreService)
    private readonly noticeStoreService: INoticeStoreService,
  ) {}

  async getDocument(
    nationalId: string,
    documentId: string,
    includeDocument: boolean,
  ): Promise<PostholfDocumentDto> {
    // Checklist: log every request with nationalId, documentId and a timestamp.
    // `@dmr.is/logging` masks national IDs; documentId carries only an HMAC of
    // the kennitala, never the kennitala itself.
    this.logger.info('Skjalaveita document request', {
      context: LOGGING_CONTEXT,
      nationalId,
      documentId,
      includeDocument,
      requestedAt: new Date().toISOString(),
    })

    const secret = process.env.POSTHOLF_DOCUMENT_ID_SECRET
    if (!secret) {
      this.logger.error(
        'POSTHOLF_DOCUMENT_ID_SECRET is not set — cannot verify document ownership',
        { context: LOGGING_CONTEXT },
      )
      throw new InternalServerErrorException(
        'Missing required environment variable: POSTHOLF_DOCUMENT_ID_SECRET',
      )
    }

    const parts = parseNoticeDocumentId(documentId)
    if (!parts) {
      throw new BadRequestException('Malformed documentId')
    }

    // Step 3 before any lookup: a mismatched fingerprint means the caller is
    // asking for someone else's document, and we do not want to touch the DB.
    if (!documentIdMatchesCompany(documentId, nationalId, secret)) {
      this.logger.warn(
        'Skjalaveita request rejected — documentId does not belong to the requested nationalId',
        { context: LOGGING_CONTEXT, documentId },
      )
      throw new NotFoundException('Document not found')
    }

    const company = await this.companyModel.findOne({
      where: { nationalId },
      attributes: ['id'],
    })

    if (!company) {
      this.logger.warn('Skjalaveita request rejected — no such company', {
        context: LOGGING_CONTEXT,
        documentId,
      })
      throw new NotFoundException('Document not found')
    }

    const wasIssued =
      await this.companyEventService.hasDeadlineReminderEventOnDate(
        company.id,
        MAILBOX_EVENT_TYPE[parts.reportType],
        parts.tier as CompanyReminderTierEnum,
        parts.dueDateYmd,
      )

    if (!wasIssued) {
      this.logger.warn(
        'Skjalaveita request rejected — no issuance event for this document',
        {
          context: LOGGING_CONTEXT,
          documentId,
          companyId: company.id,
          tier: parts.tier,
          dueDate: parts.dueDateYmd,
        },
      )
      throw new NotFoundException('Document not found')
    }

    if (!includeDocument) {
      // island.is asks for metadata when listing. Skipping the object read keeps
      // that path cheap; the body is the only thing withheld.
      return { type: 'pdf', content: '', actions: [] }
    }

    const pdf = await this.noticeStoreService.get(nationalId, documentId)
    if (!pdf) {
      // The event says we issued it, so a missing object is a real fault on our
      // side rather than an authorisation answer — but it is still not something
      // island.is can act on, so it stays a 404 to the caller and an error in our
      // logs.
      this.logger.error(
        'Notice was issued but its stored document is missing',
        { context: LOGGING_CONTEXT, documentId, companyId: company.id },
      )
      throw new NotFoundException('Document not found')
    }

    return { type: 'pdf', content: pdf.toString('base64'), actions: [] }
  }
}
