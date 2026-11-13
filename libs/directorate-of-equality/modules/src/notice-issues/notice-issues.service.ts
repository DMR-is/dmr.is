import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyModel } from '../company/models/company.model'
import { CompanyReportModel } from '../company/models/company-report.model'
import { buildMailboxDeliveryIdempotencyKey } from '../mailbox-delivery/mailbox-delivery.idempotency-key'
import { classifyDelivery } from '../mailbox-delivery/mailbox-delivery.service'
import { IMailboxDeliveryService } from '../mailbox-delivery/mailbox-delivery.service.interface'
import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from '../mailbox-delivery/models/mailbox-delivery.enums'
import { MailboxDeliveryModel } from '../mailbox-delivery/models/mailbox-delivery.model'
import { INoticeDispatchService } from '../notice-dispatch/notice-dispatch.service.interface'
import {
  NOTICE_MAILBOX_KINDS,
  noticeKindForMailboxKind,
} from '../notice-dispatch/notice-mailbox-kinds'
import { NoticeOutboxStatusEnum } from '../notice-outbox/models/notice-outbox.enums'
import { NoticeOutboxModel } from '../notice-outbox/models/notice-outbox.model'
import { ReportModel } from '../report/models/report.model'
import {
  NoticeIssueDeliveryDto,
  NoticeIssueDto,
  NoticeIssuesDto,
  OneSystemsCheckDto,
  RecentDeliveryDto,
  ReconcileDeliveryDto,
  ReminderDeliveryIssueDto,
} from './dto/notice-issues.dto'
import { noticeIssuesMessages } from './notice-issues.messages'
import {
  INoticeIssuesService,
  NoticeIssueActor,
} from './notice-issues.service.interface'

const LOGGING_CONTEXT = 'NoticeIssuesService'

/** Rows of each list. A page of more than this means something larger is wrong. */
const LIST_LIMIT = 100

/** Recent sends shown on Kerfisstillingar. */
const RECENT_LIMIT = 20

const REMINDER_KINDS = [
  MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
  MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
]

@Injectable()
export class NoticeIssuesService implements INoticeIssuesService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(NoticeOutboxModel)
    private readonly noticeModel: typeof NoticeOutboxModel,
    @InjectModel(MailboxDeliveryModel)
    private readonly deliveryModel: typeof MailboxDeliveryModel,
    @InjectModel(ReportModel)
    private readonly reportModel: typeof ReportModel,
    @InjectModel(CompanyReportModel)
    private readonly companyReportModel: typeof CompanyReportModel,
    @InjectModel(CompanyModel)
    private readonly companyModel: typeof CompanyModel,
    @Inject(INoticeDispatchService)
    private readonly noticeDispatchService: INoticeDispatchService,
    @Inject(IMailboxDeliveryService)
    private readonly mailboxDeliveryService: IMailboxDeliveryService,
  ) {}

  async getIssues(): Promise<NoticeIssuesDto> {
    // Every FAILED notice, with no time window: unlike the daily alert
    // (`findFailedNotices`, the last week), this is the list a person works
    // through, and a failed notice stays until someone acts on it. Oldest
    // first, so the ones left longest are never the ones cut off.
    const failedRows = await this.noticeModel.findAll({
      where: { status: NoticeOutboxStatusEnum.FAILED },
      order: [['processedAt', 'ASC']],
      limit: LIST_LIMIT,
    })
    const failedTotal = await this.noticeModel.count({
      where: { status: NoticeOutboxStatusEnum.FAILED },
    })

    // The dispatcher's own definition, so this list and the daily alert
    // cannot disagree about what is overdue.
    const { notices: overdue, total: overdueTotal } =
      await this.noticeDispatchService.findOverdueNotices(LIST_LIMIT)
    const overdueRows = overdue.length
      ? await this.noticeModel.findAll({
          where: { id: overdue.map((n) => n.noticeId) },
          order: [['createdAt', 'ASC']],
        })
      : []

    const stuck = await this.mailboxDeliveryService.findStuckDeliveries(
      LIST_LIMIT,
      REMINDER_KINDS,
    )
    const stuckCounts =
      await this.mailboxDeliveryService.countStuckDeliveries(REMINDER_KINDS)
    const remindersTotal =
      stuckCounts.UNCERTAIN +
      stuckCounts.INTERRUPTED +
      stuckCounts.ATTEMPTS_EXHAUSTED
    const reminderRows = stuck.length
      ? await this.deliveryModel.findAll({
          where: {
            id: stuck.map((d) => d.deliveryId),
            kind: REMINDER_KINDS,
          },
          order: [['lastAttemptAt', 'ASC']],
        })
      : []

    const notices = [...failedRows, ...overdueRows]
    const context = await this.loadNoticeContext(notices)
    const companyNames = await this.companyNames([
      ...context.companyIds,
      ...reminderRows.map((d) => d.companyId),
    ])

    const toIssue = (row: NoticeOutboxModel): NoticeIssueDto => {
      const report = context.reports.get(row.reportId)
      const companyId = context.filingCompany.get(row.reportId)
      const delivery = context.deliveries.get(row.id)
      return {
        id: row.id,
        kind: row.kind,
        status: row.status,
        reportId: row.reportId,
        reportIdentifier: report?.identifier ?? null,
        companyName: companyId ? (companyNames.get(companyId) ?? null) : null,
        attempts: row.attempts,
        lastError: row.lastError,
        createdAt: row.createdAt,
        processedAt: row.processedAt,
        delivery: delivery ? toDeliveryDto(delivery) : null,
      }
    }

    const reminders: ReminderDeliveryIssueDto[] = reminderRows.map((d) => ({
      delivery: toDeliveryDto(d),
      companyId: d.companyId,
      companyName: companyNames.get(d.companyId) ?? null,
    }))

    return {
      failed: failedRows.map(toIssue),
      failedTotal,
      overdue: overdueRows.map(toIssue),
      overdueTotal,
      reminders,
      remindersTotal,
    }
  }

  async getRecentDeliveries(): Promise<RecentDeliveryDto[]> {
    const rows = await this.deliveryModel.findAll({
      where: { status: MailboxDeliveryStatusEnum.SENT },
      order: [['sentAt', 'DESC']],
      limit: RECENT_LIMIT,
    })
    const names = await this.companyNames(rows.map((d) => d.companyId))
    return rows.map((d) => ({
      delivery: toDeliveryDto(d),
      companyId: d.companyId,
      companyName: names.get(d.companyId) ?? null,
    }))
  }

  async checkOneSystems(actor: NoticeIssueActor): Promise<OneSystemsCheckDto> {
    const result = await this.mailboxDeliveryService.checkConnection()
    this.logger.info(
      `OneSystems connection checked by user ${actor.id}: ${result.ok ? 'ok' : result.reason}`,
      { context: LOGGING_CONTEXT, userId: actor.id, ok: result.ok },
    )
    return result
  }

  async retryNotice(noticeId: string, actor: NoticeIssueActor): Promise<void> {
    const notice = await this.noticeModel.findByPk(noticeId)
    if (!notice) {
      throw new NotFoundException(noticeIssuesMessages.noticeNotFound(noticeId))
    }
    if (notice.status !== NoticeOutboxStatusEnum.FAILED) {
      throw new ConflictException(
        noticeIssuesMessages.noticeNotFailed(noticeId, notice.status),
      )
    }

    const context = await this.loadNoticeContext([notice])
    const delivery = context.deliveries.get(notice.id)

    if (delivery) {
      const state = needsAction(delivery)
      if (state.inProgress) {
        throw new ConflictException(
          noticeIssuesMessages.deliveryInProgress(delivery.id),
        )
      }
      if (state.needsReconciling) {
        throw new ConflictException(
          noticeIssuesMessages.deliveryNeedsReconciling(delivery.id),
        )
      }
      if (state.exhausted) {
        await this.rearm(delivery, actor)
      }
    }

    await this.redrive(notice.id, NoticeOutboxStatusEnum.FAILED)

    this.logger.info(`Notice ${noticeId} retried by user ${actor.id}`, {
      context: LOGGING_CONTEXT,
      noticeId,
      deliveryId: delivery?.id,
      userId: actor.id,
    })
  }

  async reconcileDelivery(
    deliveryId: string,
    dto: ReconcileDeliveryDto,
    actor: NoticeIssueActor,
  ): Promise<void> {
    const delivery = await this.deliveryModel.findByPk(deliveryId)
    if (!delivery) {
      throw new NotFoundException(
        noticeIssuesMessages.deliveryNotFound(deliveryId),
      )
    }

    const state = needsAction(delivery)
    if (state.inProgress) {
      throw new ConflictException(
        noticeIssuesMessages.deliveryInProgress(deliveryId),
      )
    }
    if (!state.needsReconciling) {
      throw new ConflictException(
        noticeIssuesMessages.deliveryNeedsNoReconciling(
          deliveryId,
          delivery.status,
        ),
      )
    }

    const documentItemId =
      delivery.oneDocumentItemId ?? dto.documentItemId ?? null
    // The SENT CHECK needs a document; a sent document exists in One, so a
    // person can find its ItemID. Never made up.
    if (dto.outcome === 'SENT' && !documentItemId) {
      throw new BadRequestException(
        noticeIssuesMessages.documentIdRequired(deliveryId),
      )
    }
    // One confirmed the send after the row went UNCERTAIN: it was sent,
    // whatever the person believes.
    if (dto.outcome === 'NOT_SENT' && delivery.sentAt) {
      throw new ConflictException(
        noticeIssuesMessages.sentConfirmedByOne(deliveryId),
      )
    }

    // The write, and its guards, belong to the mailbox-delivery module.
    const updated = await this.mailboxDeliveryService.settleUncertain(
      delivery.id,
      {
        status: delivery.status,
        inFlightStep: delivery.inFlightStep,
        oneDocumentItemId: delivery.oneDocumentItemId,
        sentAt: delivery.sentAt,
      },
      dto.outcome,
      documentItemId,
      auditNote('Reconciled', actor),
    )

    if (!updated) {
      throw new ConflictException(
        noticeIssuesMessages.deliveryChanged(deliveryId),
      )
    }

    // Its notice resumes the delivery by its key: a SENT one is recorded DONE
    // without a second letter, a NOT_SENT one goes again. A reminder has no
    // notice; the reminder task calls its key on its next run.
    const noticeKind = noticeKindForMailboxKind(delivery.kind)
    if (noticeKind) {
      const notice = await this.noticeModel.findOne({
        where: {
          reportId: reportIdFromKey(delivery.idempotencyKey),
          kind: noticeKind,
          status: NoticeOutboxStatusEnum.FAILED,
        },
      })
      if (notice) {
        await this.redrive(notice.id, NoticeOutboxStatusEnum.FAILED)
      }
    }

    this.logger.info(
      `Mailbox delivery ${deliveryId} reconciled as ${dto.outcome} by user ${actor.id}`,
      {
        context: LOGGING_CONTEXT,
        deliveryId,
        outcome: dto.outcome,
        userId: actor.id,
      },
    )
  }

  /** The "Exhausted rows" re-arm, in the mailbox-delivery module. */
  private async rearm(
    delivery: MailboxDeliveryModel,
    actor: NoticeIssueActor,
  ): Promise<void> {
    const updated = await this.mailboxDeliveryService.rearmExhausted(
      delivery.id,
      delivery.status,
      auditNote('Re-armed', actor),
    )
    if (!updated) {
      throw new ConflictException(
        noticeIssuesMessages.deliveryChanged(delivery.id),
      )
    }
  }

  /**
   * Back to the state the row was born in. Three CHECKs tie `processed_at`
   * and `channel` to `status`; a FAILED row has no channel, and clearing
   * `last_attempt_at` lets the next run pick it at once.
   */
  private async redrive(
    noticeId: string,
    from: NoticeOutboxStatusEnum,
  ): Promise<void> {
    const [updated] = await this.noticeModel.update(
      {
        status: NoticeOutboxStatusEnum.PENDING,
        processedAt: null,
        channel: null,
        attempts: 0,
        lastAttemptAt: null,
        lastError: null,
      },
      { where: { id: noticeId, status: from }, transaction: null },
    )
    if (updated === 0) {
      throw new ConflictException(noticeIssuesMessages.noticeChanged(noticeId))
    }
  }

  /** Each notice's report, filing company and mailbox delivery. */
  private async loadNoticeContext(notices: NoticeOutboxModel[]): Promise<{
    reports: Map<string, ReportModel>
    filingCompany: Map<string, string>
    companyIds: string[]
    deliveries: Map<string, MailboxDeliveryModel>
  }> {
    const reportIds = [...new Set(notices.map((n) => n.reportId))]
    if (reportIds.length === 0) {
      return {
        reports: new Map(),
        filingCompany: new Map(),
        companyIds: [],
        deliveries: new Map(),
      }
    }

    const reports = await this.reportModel.findAll({
      where: { id: reportIds },
      attributes: ['id', 'type', 'identifier'],
    })
    const filings = await this.companyReportModel.findAll({
      where: { reportId: reportIds, parentCompanyId: null },
      attributes: ['reportId', 'companyId'],
    })

    const reportById = new Map(reports.map((r) => [r.id, r]))
    const filingCompany = new Map(filings.map((f) => [f.reportId, f.companyId]))

    // The key the dispatcher builds for the notice (`sendToMailbox`).
    const keyByNotice = new Map<string, string>()
    for (const notice of notices) {
      const report = reportById.get(notice.reportId)
      const companyId = filingCompany.get(notice.reportId)
      if (!report || !companyId) continue
      keyByNotice.set(
        notice.id,
        buildMailboxDeliveryIdempotencyKey({
          kind: NOTICE_MAILBOX_KINDS[notice.kind][report.type],
          companyId,
          discriminator: report.id,
        }),
      )
    }

    const deliveryRows = keyByNotice.size
      ? await this.deliveryModel.findAll({
          where: { idempotencyKey: [...new Set(keyByNotice.values())] },
        })
      : []
    const deliveryByKey = new Map(
      deliveryRows.map((d) => [d.idempotencyKey, d]),
    )
    const deliveries = new Map<string, MailboxDeliveryModel>()
    for (const [noticeId, key] of keyByNotice) {
      const delivery = deliveryByKey.get(key)
      if (delivery) deliveries.set(noticeId, delivery)
    }

    return {
      reports: reportById,
      filingCompany,
      companyIds: [...new Set(filingCompany.values())],
      deliveries,
    }
  }

  private async companyNames(ids: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(ids)]
    if (unique.length === 0) return new Map()
    const companies = await this.companyModel.findAll({
      where: { id: unique },
      attributes: ['id', 'name'],
    })
    return new Map(companies.map((c) => [c.id, c.name]))
  }
}

/** The shared rule (`classifyDelivery`), plus what the page acts on. */
function needsAction(row: MailboxDeliveryModel): {
  exhausted: boolean
  needsReconciling: boolean
  inProgress: boolean
} {
  const state = classifyDelivery(row)
  return {
    exhausted: state.exhausted,
    inProgress: state.inProgress,
    needsReconciling:
      row.status === MailboxDeliveryStatusEnum.UNCERTAIN || state.interrupted,
  }
}

/**
 * Which call is in doubt, for a person checking One, read as the README's
 * "Reconciling an UNCERTAIN row" does: a marker names it; otherwise no saved
 * document means CreateDocument, a saved one the send.
 */
function uncertainStep(row: MailboxDeliveryModel): MailboxDeliveryStepEnum {
  if (row.inFlightStep) return row.inFlightStep
  return row.oneDocumentItemId
    ? MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS
    : MailboxDeliveryStepEnum.CREATE_DOCUMENT
}

function toDeliveryDto(row: MailboxDeliveryModel): NoticeIssueDeliveryDto {
  const state = needsAction(row)
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    attempts: row.attempts,
    exhausted: state.exhausted,
    needsReconciling: state.needsReconciling,
    inProgress: state.inProgress,
    uncertainStep: state.needsReconciling ? uncertainStep(row) : null,
    oneCaseNumber: row.oneCaseNumber,
    oneDocumentItemId: row.oneDocumentItemId,
    lastErrorNumber: row.lastErrorNumber,
    lastAttemptAt: row.lastAttemptAt,
    sentAt: row.sentAt,
  }
}

/** A notice's key ends in its report id, upper-cased (`buildMailboxDeliveryIdempotencyKey`). */
function reportIdFromKey(key: string): string {
  return key.slice(key.lastIndexOf(':') + 1).toLowerCase()
}

function auditNote(action: string, actor: NoticeIssueActor): string {
  const date = new Date().toISOString().slice(0, 10)
  return `${action} by ${actor.name} (${actor.id}) on ${date}`
}
