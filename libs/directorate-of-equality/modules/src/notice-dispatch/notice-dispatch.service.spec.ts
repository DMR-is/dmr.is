import { Op } from 'sequelize'

import { ReportMailOutcome } from '../mail/doe-mail.service.interface'
import {
  NoticeOutboxChannelEnum,
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../notice-outbox/models/notice-outbox.enums'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.model'
import { ReportEventTypeEnum } from '../report/models/report-event.model'
import {
  NOTICE_DISPATCH_BATCH_SIZE,
  NOTICE_DISPATCH_MAX_ATTEMPTS,
  NOTICE_DISPATCH_RETRY_DELAY_MS,
  NoticeDispatchService,
} from './notice-dispatch.service'

describe('NoticeDispatchService', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const mailService = {
    sendReportApproved: jest.fn(),
    sendReportDenied: jest.fn(),
  }

  const reportPdfService = {
    generateReportPdf: jest.fn(),
    generateImprovementPlanPdf: jest.fn(),
  }

  const companyFileService = {
    archive: jest.fn(),
  }

  const noticeOutboxModel = {
    findAll: jest.fn(),
    update: jest.fn(),
  }

  const reportModel = {
    findOne: jest.fn(),
  }

  const reportEventModel = {
    findOne: jest.fn(),
  }

  const lockTransaction = { id: 'lock-tx' } as never

  /*
   * `sequelize.transaction({ transaction: parent }, work)` opens a savepoint on
   * `parent`. The fake hands `work` a marker naming its parent, so a test can
   * check what nests in what, and rejects as the real one does when `work`
   * throws.
   */
  const sequelize = {
    transaction: jest.fn(),
  }

  const NOW = new Date('2026-10-08T10:00:00.000Z')
  const APPROVED_AT = new Date('2026-10-08T09:58:00.000Z')

  let service: NoticeDispatchService

  const outboxRow = (
    kind: NoticeOutboxKindEnum,
    overrides: Partial<{ attempts: number; lastAttemptAt: Date | null }> = {},
  ) => ({
    id: 'notice-1',
    kind,
    reportId: 'report-1',
    status: NoticeOutboxStatusEnum.PENDING,
    attempts: 0,
    lastAttemptAt: null,
    ...overrides,
  })

  const approvedReport = (overrides: Record<string, unknown> = {}) => ({
    id: 'report-1',
    type: ReportTypeEnum.EQUALITY,
    validUntil: new Date('2029-10-08'),
    contactEmail: 'contact@example.is',
    companyAdminEmail: null,
    companyNationalId: '5500000000',
    approvedAt: APPROVED_AT,
    ...overrides,
  })

  /** The single update the dispatcher made for `notice-1`. */
  const lastOutboxUpdate = () => {
    const calls = noticeOutboxModel.update.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    return calls[calls.length - 1]
  }

  /*
   * `jest.preset.js` sets `clearMocks` but not `resetMocks`, so an
   * implementation set in one test would leak into the next. Every collaborator
   * a test can fail is re-armed to its happy value here.
   */
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers({ doNotFake: ['nextTick', 'queueMicrotask'] })
    jest.setSystemTime(NOW)

    noticeOutboxModel.findAll.mockResolvedValue([])
    noticeOutboxModel.update.mockResolvedValue([1])
    reportModel.findOne.mockResolvedValue(approvedReport())
    reportEventModel.findOne.mockResolvedValue({ reason: 'Vantar gögn' })
    reportPdfService.generateReportPdf.mockResolvedValue({
      pdf: Buffer.from('pdf-bytes'),
      fileName: 'jafnrettisaaetlun-report-1.pdf',
    })
    // Null is the common case: a compliant company has no plan to attach.
    reportPdfService.generateImprovementPlanPdf.mockResolvedValue(null)
    companyFileService.archive.mockResolvedValue([])
    mailService.sendReportApproved.mockResolvedValue(ReportMailOutcome.SENT)
    mailService.sendReportDenied.mockResolvedValue(ReportMailOutcome.SENT)
    sequelize.transaction.mockImplementation(
      async (
        options: { transaction: unknown },
        work: (savepoint: unknown) => Promise<unknown>,
      ) => work({ savepointOf: options.transaction }),
    )

    service = new NoticeDispatchService(
      logger as never,
      mailService as never,
      reportPdfService as never,
      companyFileService as never,
      noticeOutboxModel as never,
      reportModel as never,
      reportEventModel as never,
      sequelize as never,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('picking rows', () => {
    it('takes the oldest due PENDING rows, a bounded batch', async () => {
      await service.dispatchPending(lockTransaction)

      const [query] = noticeOutboxModel.findAll.mock.calls[0]
      expect(query.where.status).toBe(NoticeOutboxStatusEnum.PENDING)
      expect(query.order).toEqual([['createdAt', 'ASC']])
      expect(query.limit).toBe(NOTICE_DISPATCH_BATCH_SIZE)
      // A row tried less than the retry delay ago is not due yet.
      expect(query.where[Op.or]).toEqual([
        { lastAttemptAt: null },
        {
          lastAttemptAt: {
            [Op.lt]: new Date(NOW.getTime() - NOTICE_DISPATCH_RETRY_DELAY_MS),
          },
        },
      ])
    })

    it('reports what it picked and settled', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_SUBMITTED),
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 2,
        settled: 2,
      })
    })

    // One at a time: each approval launches Chromium, and the pool is shared
    // with the advisory lock's own connection.
    it('sends rows one after another, never in parallel', async () => {
      const order: string[] = []
      noticeOutboxModel.findAll.mockResolvedValue([
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED), id: 'a' },
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED), id: 'b' },
      ])
      mailService.sendReportApproved.mockImplementation(async () => {
        order.push('send')
        return ReportMailOutcome.SENT
      })
      noticeOutboxModel.update.mockImplementation(async () => {
        order.push('record')
        return [1]
      })

      await service.dispatchPending(lockTransaction)

      expect(order).toEqual(['send', 'record', 'send', 'record'])
    })
  })

  describe('recording outcomes', () => {
    /*
     * ⚠️ `transaction: null` on every outbox write. The dispatcher runs inside
     * the advisory-lock transaction; a DONE written inside it would roll back
     * with any later failure in the run, after the mail had gone, and the next
     * run would mail the company again.
     */
    it('writes every outcome outside the ambient transaction', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])

      await service.dispatchPending(lockTransaction)

      const [, options] = lastOutboxUpdate()
      expect(options.transaction).toBeNull()
    })

    it('marks a sent notice DONE by email', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])

      await service.dispatchPending(lockTransaction)

      const [values, options] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.DONE,
          channel: NoticeOutboxChannelEnum.EMAIL,
          attempts: 1,
          lastError: null,
          processedAt: NOW,
        }),
      )
      // Only a row still PENDING is settled, so one some other path already
      // settled is not overwritten.
      expect(options.where).toEqual({
        id: 'notice-1',
        status: NoticeOutboxStatusEnum.PENDING,
      })
    })

    // A submission never had an email. The receipt goes out only through the
    // mailbox, which this phase does not send.
    it('skips a submission receipt without sending anything', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_SUBMITTED),
      ])

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(reportModel.findOne).not.toHaveBeenCalled()
      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.SKIPPED,
          channel: null,
          processedAt: NOW,
        }),
      )
    })

    it('keeps a failed send PENDING and counts the attempt', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])
      mailService.sendReportApproved.mockResolvedValue(ReportMailOutcome.FAILED)

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 0,
      })

      const [values, options] = lastOutboxUpdate()
      expect(values).toEqual({
        attempts: 1,
        lastAttemptAt: NOW,
        lastError: 'send failed',
      })
      expect(values).not.toHaveProperty('status')
      // Like `settle`: a row some other path already settled is left alone.
      expect(options).toEqual({
        where: { id: 'notice-1', status: NoticeOutboxStatusEnum.PENDING },
        transaction: null,
      })
    })

    it('gives up as FAILED on the last allowed attempt', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_DENIED, {
          attempts: NOTICE_DISPATCH_MAX_ATTEMPTS - 1,
        }),
      ])
      mailService.sendReportDenied.mockResolvedValue(ReportMailOutcome.FAILED)

      await service.dispatchPending(lockTransaction)

      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          attempts: NOTICE_DISPATCH_MAX_ATTEMPTS,
        }),
      )
      expect(logger.error).toHaveBeenCalled()
    })

    // No retry will ever find an address the report does not have.
    it('gives up at once when the report names no recipient', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_DENIED),
      ])
      mailService.sendReportDenied.mockResolvedValue(
        ReportMailOutcome.NO_RECIPIENT,
      )

      await service.dispatchPending(lockTransaction)

      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: 'no usable contact or admin email',
          attempts: 1,
        }),
      )
      expect(logger.error).toHaveBeenCalled()
    })

    it('gives up when the report is gone', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])
      reportModel.findOne.mockResolvedValue(null)

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: 'report not found',
        }),
      )
    })

    // A throw is retried like a failed send, and one bad row does not stop the
    // run for the rows behind it.
    it('treats a throw as a failed attempt and moves on to the next row', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED), id: 'a' },
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_DENIED), id: 'b' },
      ])
      reportModel.findOne
        .mockRejectedValueOnce(new Error('db hiccup'))
        .mockResolvedValue(approvedReport())

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 2,
        settled: 1,
      })

      expect(noticeOutboxModel.update).toHaveBeenCalledWith(
        expect.objectContaining({ attempts: 1, lastError: 'send failed' }),
        {
          where: { id: 'a', status: NoticeOutboxStatusEnum.PENDING },
          transaction: null,
        },
      )
      expect(mailService.sendReportDenied).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalled()
    })

    it('does not throw when the outcome cannot be recorded', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])
      noticeOutboxModel.update.mockRejectedValue(new Error('pool exhausted'))

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 0,
      })
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('it will be sent again'),
        expect.anything(),
      )
    })
  })

  describe('approval notice', () => {
    beforeEach(() => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])
    })

    it('mails the company the report PDF on an EQUALITY approval', async () => {
      const report = approvedReport()
      reportModel.findOne.mockResolvedValue(report)

      await service.dispatchPending(lockTransaction)

      expect(reportPdfService.generateReportPdf).toHaveBeenCalledWith(
        'report-1',
      )
      expect(mailService.sendReportApproved).toHaveBeenCalledWith(report, [
        {
          filename: 'jafnrettisaaetlun-report-1.pdf',
          content: Buffer.from('pdf-bytes'),
          label: 'jafnréttisáætlun',
        },
      ])
    })

    it('attaches the úrbótaáætlun as a second document on a SALARY approval', async () => {
      const report = approvedReport({ type: ReportTypeEnum.SALARY })
      reportModel.findOne.mockResolvedValue(report)
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaetlun-report-1.pdf',
      })

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).toHaveBeenCalledWith(report, [
        {
          filename: 'launagreining-report-1.pdf',
          content: Buffer.from('report-bytes'),
          label: 'jafnlaunaúttekt',
        },
        {
          filename: 'urbotaaetlun-report-1.pdf',
          content: Buffer.from('plan-bytes'),
          label: 'úrbótaáætlun',
        },
      ])
    })

    it('archives every attachment under the company national id', async () => {
      // Deliberately 23:55 UTC, with the dispatcher running past midnight: if
      // the key ever went back to `new Date()` at archive time, this would file
      // under the next day, and the reconstructible-key argument that excuses
      // having no `s3_key` column would break silently.
      const approvedAt = new Date('2026-10-08T23:55:00.000Z')
      jest.setSystemTime(new Date('2026-10-09T00:02:00.000Z'))
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY, approvedAt }),
      )
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaetlun-report-1.pdf',
      })

      await service.dispatchPending(lockTransaction)

      expect(companyFileService.archive).toHaveBeenCalledWith([
        expect.objectContaining({
          companyNationalId: '5500000000',
          filename: 'launagreining-report-1.pdf',
          content: Buffer.from('report-bytes'),
          issuedAt: approvedAt,
        }),
        expect.objectContaining({
          companyNationalId: '5500000000',
          filename: 'urbotaaetlun-report-1.pdf',
          content: Buffer.from('plan-bytes'),
          issuedAt: approvedAt,
        }),
      ])
    })

    /**
     * ⚠️ Archiving runs AFTER the send, and after the DONE write. Uploading
     * first would let an unset or misconfigured bucket stop the notification;
     * uploading before DONE would leave seconds of S3 calls in which a deploy
     * kills the process after the mail, and the next run mails again.
     */
    it('sends the mail, records DONE, then archives', async () => {
      const order: string[] = []
      mailService.sendReportApproved.mockImplementation(async () => {
        order.push('mail')
        return ReportMailOutcome.SENT
      })
      noticeOutboxModel.update.mockImplementation(async (values) => {
        order.push(`record ${values.status}`)
        return [1]
      })
      companyFileService.archive.mockImplementation(async () => {
        order.push('archive')
        return []
      })

      await service.dispatchPending(lockTransaction)

      expect(order).toEqual([
        'mail',
        `record ${NoticeOutboxStatusEnum.DONE}`,
        'archive',
      ])
    })

    it('does not archive when DONE could not be recorded', async () => {
      noticeOutboxModel.update.mockRejectedValue(new Error('pool exhausted'))

      await service.dispatchPending(lockTransaction)

      // The row stays PENDING and the next run sends and archives again.
      expect(companyFileService.archive).not.toHaveBeenCalled()
    })

    it('keeps the row DONE when archiving throws', async () => {
      companyFileService.archive.mockRejectedValue(new Error('s3 down'))

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 1,
      })

      // One write, DONE; nothing turned the throw into a retryable failure.
      expect(noticeOutboxModel.update).toHaveBeenCalledTimes(1)
      const [values] = lastOutboxUpdate()
      expect(values.status).toBe(NoticeOutboxStatusEnum.DONE)
    })

    /*
     * ⚠️ Reads join the lock's transaction, so one failed query would abort it
     * for everything after. Each row runs in a savepoint on it, and each render
     * in a savepoint on the row's.
     */
    it('runs the row, and each render, in its own savepoint', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )

      await service.dispatchPending(lockTransaction)

      const parents = sequelize.transaction.mock.calls.map(
        ([options]) => options.transaction,
      )
      const rowSavepoint = { savepointOf: lockTransaction }
      expect(parents).toEqual([lockTransaction, rowSavepoint, rowSavepoint])
    })

    it('still sends the plan when the report render fails on a DB error', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )
      reportPdfService.generateReportPdf.mockRejectedValue(
        new Error('current transaction is aborted'),
      )
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaaetlun-report-1.pdf',
      })

      await service.dispatchPending(lockTransaction)

      const [, attachments] = mailService.sendReportApproved.mock.calls[0]
      expect(attachments).toEqual([
        expect.objectContaining({ label: 'úrbótaáætlun' }),
      ])
    })

    /*
     * ⚠️ The archive is the Directorate's copy of what the company RECEIVED, so
     * writing it after a failed send puts a false yes where someone will later
     * look for proof of delivery.
     */
    it.each([ReportMailOutcome.FAILED, ReportMailOutcome.NO_RECIPIENT])(
      'does not archive when the mail outcome is %s',
      async (outcome) => {
        mailService.sendReportApproved.mockResolvedValue(outcome)

        await service.dispatchPending(lockTransaction)

        expect(mailService.sendReportApproved).toHaveBeenCalled()
        expect(companyFileService.archive).not.toHaveBeenCalled()
      },
    )

    // The prefix IS the retrieval path, so a document filed without a national
    // id is one nobody will find.
    it('skips archiving and warns when the report has no companyNationalId', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ companyNationalId: null }),
      )

      await service.dispatchPending(lockTransaction)

      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(mailService.sendReportApproved).toHaveBeenCalled()
      expect(logger.warn).toHaveBeenCalled()
    })

    /**
     * ⚠️ A failing plan render must not cost the company its report.
     */
    it('mails the report alone when the úrbótaáætlun render throws', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockRejectedValue(
        new Error('chromium died'),
      )

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).toHaveBeenCalledTimes(1)
      const [, attachments] = mailService.sendReportApproved.mock.calls[0]
      expect(attachments).toHaveLength(1)
      expect(attachments[0].label).toBe('jafnlaunaúttekt')
      expect(logger.error).toHaveBeenCalled()
    })

    // A compliant company has no plan; the salary report carries that finding.
    it('sends only the report when there is no úrbótaáætlun', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue(null)

      await service.dispatchPending(lockTransaction)

      const [, attachments] = mailService.sendReportApproved.mock.calls[0]
      expect(attachments).toHaveLength(1)
    })

    // An equality report has no outlier groups, so the plan must not be asked
    // for at all.
    it('does not ask for an úrbótaáætlun on an EQUALITY approval', async () => {
      await service.dispatchPending(lockTransaction)

      expect(reportPdfService.generateImprovementPlanPdf).not.toHaveBeenCalled()
    })

    /*
     * ⚠️ The NOTICE STILL GOES, without the attachment. The notice is the part
     * that cannot be reconstructed later; the PDF can be downloaded from the
     * report screen.
     */
    it('still notifies when the PDF cannot be rendered', async () => {
      reportPdfService.generateReportPdf.mockRejectedValue(
        new Error('chromium is missing'),
      )

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'report-1' }),
        [],
      )
      // And nothing is archived, because nothing was produced to archive.
      expect(companyFileService.archive).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalled()
      const [values] = lastOutboxUpdate()
      expect(values.status).toBe(NoticeOutboxStatusEnum.DONE)
    })
  })

  describe('denial notice', () => {
    beforeEach(() => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_DENIED),
      ])
    })

    it('mails the company the reason from the denial event', async () => {
      const report = {
        id: 'report-1',
        type: ReportTypeEnum.EQUALITY,
        contactEmail: 'contact@example.is',
        companyAdminEmail: null,
      }
      reportModel.findOne.mockResolvedValue(report)

      await service.dispatchPending(lockTransaction)

      expect(reportEventModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            reportId: 'report-1',
            eventType: ReportEventTypeEnum.STATUS_CHANGED,
            toStatus: ReportStatusEnum.DENIED,
          },
        }),
      )
      expect(mailService.sendReportDenied).toHaveBeenCalledWith(
        report,
        'Vantar gögn',
      )
      const [values] = lastOutboxUpdate()
      expect(values.status).toBe(NoticeOutboxStatusEnum.DONE)
    })

    // `deny` refuses a blank reason, so a missing one means the event is gone.
    // A denial with no reason tells the company nothing it can act on.
    it('gives up rather than mailing a denial with no reason', async () => {
      reportEventModel.findOne.mockResolvedValue(null)

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: 'denial reason not found',
        }),
      )
    })
  })
})
