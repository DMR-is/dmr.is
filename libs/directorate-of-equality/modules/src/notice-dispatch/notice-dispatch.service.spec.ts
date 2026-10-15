import { Op } from 'sequelize'

import { ReportMailOutcome } from '../mail/doe-mail.service.interface'
import { buildMailboxDeliveryIdempotencyKey } from '../mailbox-delivery/mailbox-delivery.idempotency-key'
import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
} from '../mailbox-delivery/models/mailbox-delivery.enums'
import {
  NoticeOutboxChannelEnum,
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../notice-outbox/models/notice-outbox.enums'
import { ReportStatusEnum, ReportTypeEnum } from '../report/models/report.model'
import { ReportEventTypeEnum } from '../report/models/report-event.model'
import { mergePdfs } from '../report-pdf/lib/merge'
import {
  NOTICE_DISPATCH_BATCH_SIZE,
  NOTICE_DISPATCH_MAX_ATTEMPTS,
  NOTICE_DISPATCH_RETRY_DELAY_MS,
  NOTICE_DISPATCH_TIME_BUDGET_MS,
  NOTICE_OVERDUE_AFTER_MS,
  NoticeDispatchService,
  offersServiceSurvey,
} from './notice-dispatch.service'

// pdf-lib cannot load the fake PDF bytes these tests pass around.
jest.mock('../report-pdf/lib/merge', () => ({
  mergePdfs: jest.fn(),
}))

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
    count: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  }

  const reportModel = {
    findOne: jest.fn(),
  }

  const reportEventModel = {
    findOne: jest.fn(),
  }

  const companyReportModel = {
    findOne: jest.fn(),
  }

  const mailboxDeliveryService = {
    deliverToMailbox: jest.fn(),
    findDelivery: jest.fn(),
  }

  const pdfRenderService = {
    renderHtml: jest.fn(),
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
  const COMPANY_ID = '0b9f5c1e-6a3d-4c2b-9e8f-1a2b3c4d5e6f'
  const APPROVED_AT = new Date('2026-10-08T09:58:00.000Z')

  let service: NoticeDispatchService

  /** A status each kind is owed in: what the report says when it is sent. */
  const OWED_STATUS: Record<NoticeOutboxKindEnum, ReportStatusEnum> = {
    [NoticeOutboxKindEnum.REPORT_SUBMITTED]: ReportStatusEnum.SUBMITTED,
    [NoticeOutboxKindEnum.REPORT_APPROVED]: ReportStatusEnum.APPROVED,
    [NoticeOutboxKindEnum.REPORT_DENIED]: ReportStatusEnum.DENIED,
  }

  /*
   * The report's default status follows the last row built, so a test about a
   * denial reads a DENIED report without saying so. A test about a notice no
   * longer owed sets `status` itself.
   */
  let owedStatus: ReportStatusEnum

  const outboxRow = (
    kind: NoticeOutboxKindEnum,
    overrides: Partial<{ attempts: number; lastAttemptAt: Date | null }> = {},
  ) => {
    owedStatus = OWED_STATUS[kind]
    return {
      id: 'notice-1',
      kind,
      reportId: 'report-1',
      status: NoticeOutboxStatusEnum.PENDING,
      attempts: 0,
      lastAttemptAt: null,
      createdAt: NOW,
      ...overrides,
    }
  }

  const approvedReport = (overrides: Record<string, unknown> = {}) => ({
    id: 'report-1',
    type: ReportTypeEnum.EQUALITY,
    validUntil: new Date('2029-10-08'),
    contactEmail: 'contact@example.is',
    companyAdminEmail: null,
    companyNationalId: '5500000000',
    approvedAt: APPROVED_AT,
    status: owedStatus,
    ...overrides,
  })

  /** A `findDelivery` answer: nothing set unless the test says so. */
  const deliveryState = (overrides: Record<string, unknown> = {}) => ({
    deliveryId: 'delivery-1',
    status: MailboxDeliveryStatusEnum.FAILED,
    documentFiled: false,
    sent: false,
    interrupted: false,
    inProgress: false,
    exhausted: false,
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
    owedStatus = ReportStatusEnum.APPROVED
    reportModel.findOne.mockImplementation(async () => approvedReport())
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
    delete process.env.ONESYSTEMS_ENABLED
    // The filing company's snapshot: the mailbox reads its id and name, the
    // survey decision whether the company owes a salary report.
    companyReportModel.findOne.mockResolvedValue({
      companyId: COMPANY_ID,
      name: 'Fyrirtæki ehf.',
      company: { salaryReportRequired: false },
    })
    mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
      status: 'SENT',
      deliveryId: 'delivery-1',
      islandIsDocumentId: 'doc-1',
      sentAt: NOW,
      alreadySent: false,
    })
    mailboxDeliveryService.findDelivery.mockResolvedValue(null)
    pdfRenderService.renderHtml.mockResolvedValue(Buffer.from('letter-pdf'))
    jest.mocked(mergePdfs).mockResolvedValue(Buffer.from('merged-pdf'))
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
      mailboxDeliveryService as never,
      pdfRenderService as never,
      noticeOutboxModel as never,
      reportModel as never,
      reportEventModel as never,
      companyReportModel as never,
      sequelize as never,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
    delete process.env.ONESYSTEMS_ENABLED
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
        outboxRow(NoticeOutboxKindEnum.REPORT_DENIED),
        outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
      ])

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 2,
        settled: 2,
      })
    })

    // Quarantine halts every outbound touchpoint: the row is not picked, so it
    // waits PENDING without taking a batch slot.
    it('leaves out rows whose filing company is quarantined', async () => {
      await service.dispatchPending(lockTransaction)

      const [query] = noticeOutboxModel.findAll.mock.calls[0]
      const [notQuarantined] = query.where[Op.and]
      expect(notQuarantined.val).toContain('c.quarantined')
      expect(notQuarantined.val).toContain('cr.parent_company_id IS NULL')
      expect(notQuarantined.val).toContain('"NoticeOutboxModel"."report_id"')
    })

    // A receipt has no email. With the flag off it waits rather than taking a
    // batch slot from a notice that can go.
    it('leaves out submission receipts while mailbox delivery is off', async () => {
      await service.dispatchPending(lockTransaction)

      const [query] = noticeOutboxModel.findAll.mock.calls[0]
      expect(query.where.kind).toEqual({
        [Op.ne]: NoticeOutboxKindEnum.REPORT_SUBMITTED,
      })
    })

    it('picks submission receipts while mailbox delivery is on', async () => {
      process.env.ONESYSTEMS_ENABLED = 'true'

      await service.dispatchPending(lockTransaction)

      const [query] = noticeOutboxModel.findAll.mock.calls[0]
      expect(query.where.kind).toBeUndefined()
    })

    // One slow mailbox row can take minutes, and the run holds the lock's
    // transaction throughout.
    it('starts no new row once the run is past its time budget', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_DENIED), id: 'a' },
        { ...outboxRow(NoticeOutboxKindEnum.REPORT_DENIED), id: 'b' },
      ])
      mailService.sendReportDenied.mockImplementation(async () => {
        jest.advanceTimersByTime(NOTICE_DISPATCH_TIME_BUDGET_MS)
        return ReportMailOutcome.SENT
      })

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 1,
      })
      expect(mailService.sendReportDenied).toHaveBeenCalledTimes(1)
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

    // A submission never had an email; the receipt goes out only through the
    // mailbox. A receipt picked as the flag goes off mid-run is held, not
    // settled: switching the flag off must not drop it.
    it('holds a submission receipt PENDING while mailbox delivery is off', async () => {
      noticeOutboxModel.findAll.mockResolvedValue([
        outboxRow(NoticeOutboxKindEnum.REPORT_SUBMITTED, { attempts: 2 }),
      ])

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 0,
      })

      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(reportModel.findOne).not.toHaveBeenCalled()
      const [values, options] = lastOutboxUpdate()
      // Not an attempt: `attempts` and `status` are left alone.
      expect(values).toEqual({
        lastAttemptAt: NOW,
        lastError: 'mailbox delivery is off',
      })
      expect(options.where).toEqual({
        id: 'notice-1',
        status: NoticeOutboxStatusEnum.PENDING,
      })
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
        expect.stringContaining('the next run tries it again'),
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
      expect(mailService.sendReportApproved).toHaveBeenCalledWith(
        report,
        [
          {
            filename: 'jafnrettisaaetlun-report-1.pdf',
            content: Buffer.from('pdf-bytes'),
            label: 'jafnréttisáætlun',
          },
        ],
        // With no salary report owed, the equality approval completes them.
        { serviceSurvey: true },
      )
    })

    it('attaches the úrbótaáætlun as a second document on a SALARY approval', async () => {
      const report = approvedReport({ type: ReportTypeEnum.SALARY })
      reportModel.findOne.mockResolvedValue(report)
      companyReportModel.findOne.mockResolvedValue({
        companyId: COMPANY_ID,
        company: { salaryReportRequired: true },
      })
      reportPdfService.generateReportPdf.mockResolvedValue({
        pdf: Buffer.from('report-bytes'),
        fileName: 'launagreining-report-1.pdf',
      })
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaetlun-report-1.pdf',
      })

      await service.dispatchPending(lockTransaction)

      expect(mailService.sendReportApproved).toHaveBeenCalledWith(
        report,
        [
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
        ],
        { serviceSurvey: true },
      )
    })

    describe('service survey', () => {
      /*
       * Asked only by the approval that completes the company's obligations,
       * which follow `salary_report_required` (override included), not size:
       * the equality report when no salary report is owed, else the salary
       * report.
       */
      it.each([
        [ReportTypeEnum.EQUALITY, false, true],
        // A salary report is still owed, whatever the size bucket says.
        [ReportTypeEnum.EQUALITY, true, false],
        // No filing company found.
        [ReportTypeEnum.EQUALITY, null, false],
        // The salary report is always the last filing.
        [ReportTypeEnum.SALARY, true, true],
        [ReportTypeEnum.SALARY, false, true],
        [ReportTypeEnum.SALARY, null, true],
      ])(
        '%s approval, salary report required %s: %s',
        (type, salaryReportRequired, expected) => {
          expect(offersServiceSurvey(type, salaryReportRequired)).toBe(expected)
        },
      )

      // The filing company's own row, not a subsidiary's on a group report,
      // with the company's current obligation joined in.
      it("reads the filing company's salary obligation", async () => {
        await service.dispatchPending(lockTransaction)

        expect(companyReportModel.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { reportId: 'report-1', parentCompanyId: null },
            include: [
              expect.objectContaining({
                as: 'company',
                attributes: expect.arrayContaining(['salaryReportRequired']),
              }),
            ],
          }),
        )
      })

      it('asks nothing on an equality approval while a salary report is owed', async () => {
        companyReportModel.findOne.mockResolvedValue({
          companyId: COMPANY_ID,
          company: { salaryReportRequired: true },
        })

        await service.dispatchPending(lockTransaction)

        expect(mailService.sendReportApproved).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          { serviceSurvey: false },
        )
      })

      it('asks nothing when the report has no snapshot', async () => {
        companyReportModel.findOne.mockResolvedValue(null)

        await service.dispatchPending(lockTransaction)

        expect(mailService.sendReportApproved).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          { serviceSurvey: false },
        )
      })
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

    it('does not archive when the row was no longer PENDING', async () => {
      // Another path (a hand re-drive, a second dispatcher) settled it first.
      noticeOutboxModel.update.mockResolvedValue([0])

      await expect(service.dispatchPending(lockTransaction)).resolves.toEqual({
        picked: 1,
        settled: 0,
      })

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
     * for everything after. Each row runs in a savepoint on it, and so does
     * each render: on the row's savepoint, Sequelize would number the render
     * savepoints after the row's parent count and reuse earlier rows' names.
     */
    it('runs the row, and each render, in its own savepoint on the lock', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )

      await service.dispatchPending(lockTransaction)

      const parents = sequelize.transaction.mock.calls.map(
        ([options]) => options.transaction,
      )
      expect(parents).toEqual([
        lockTransaction,
        lockTransaction,
        lockTransaction,
      ])
    })

    /*
     * Mocks cannot model an aborted transaction; the savepoint test above is
     * what guards that. This pins only that one render's failure costs only its
     * own attachment.
     */
    it('still sends the plan when the report render fails', async () => {
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
        expect.anything(),
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
        status: ReportStatusEnum.DENIED,
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

  /*
   * The flag went off while some approvals and denials were already partly
   * through One. Each is checked against its delivery (same key) before it is
   * emailed, so the company does not get it twice.
   */
  describe('a notice no longer owed', () => {
    const dispatch = async (kind: NoticeOutboxKindEnum) => {
      noticeOutboxModel.findAll.mockResolvedValue([outboxRow(kind)])
      return service.dispatchPending(lockTransaction)
    }

    const skipped = (status: ReportStatusEnum, kind: NoticeOutboxKindEnum) =>
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.SKIPPED,
          channel: null,
          lastError: `report is ${status}; a ${kind} notice is no longer owed`,
        }),
      )

    /*
     * A quarantine holds a decision unpicked. Released after the report was
     * superseded, it must not mail a stale approval with its PDFs.
     */
    it.each([
      [NoticeOutboxKindEnum.REPORT_APPROVED, ReportStatusEnum.SUPERSEDED],
      [NoticeOutboxKindEnum.REPORT_DENIED, ReportStatusEnum.SUBMITTED],
    ])(
      'settles %s SKIPPED by email when the report is now %s, and sends nothing',
      async (kind, status) => {
        reportModel.findOne.mockResolvedValue(approvedReport({ status }))

        await dispatch(kind)

        expect(mailService.sendReportApproved).not.toHaveBeenCalled()
        expect(mailService.sendReportDenied).not.toHaveBeenCalled()
        expect(reportPdfService.generateReportPdf).not.toHaveBeenCalled()
        skipped(status, kind)
      },
    )

    describe('with mailbox delivery on', () => {
      beforeEach(() => {
        process.env.ONESYSTEMS_ENABLED = 'true'
      })

      /*
       * The receipts held while the flag was off: the first run with it on
       * must not send "received" for a report decided since.
       */
      it.each([
        ReportStatusEnum.APPROVED,
        ReportStatusEnum.DENIED,
        ReportStatusEnum.SUPERSEDED,
        ReportStatusEnum.WITHDRAWN,
      ])('settles a receipt SKIPPED when the report is %s', async (status) => {
        reportModel.findOne.mockResolvedValue(approvedReport({ status }))

        await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

        expect(mailboxDeliveryService.deliverToMailbox).not.toHaveBeenCalled()
        skipped(status, NoticeOutboxKindEnum.REPORT_SUBMITTED)
      })

      it.each([
        ReportStatusEnum.SUBMITTED,
        ReportStatusEnum.POSTPONED,
        ReportStatusEnum.IN_REVIEW,
      ])('sends a receipt while the report is %s', async (status) => {
        reportModel.findOne.mockResolvedValue(approvedReport({ status }))

        await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

        expect(mailboxDeliveryService.deliverToMailbox).toHaveBeenCalledTimes(1)
        expect(lastOutboxUpdate()[0].status).toBe(NoticeOutboxStatusEnum.DONE)
      })

      it('settles a superseded approval SKIPPED without delivering it', async () => {
        reportModel.findOne.mockResolvedValue(
          approvedReport({ status: ReportStatusEnum.SUPERSEDED }),
        )

        await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

        expect(mailboxDeliveryService.deliverToMailbox).not.toHaveBeenCalled()
        skipped(
          ReportStatusEnum.SUPERSEDED,
          NoticeOutboxKindEnum.REPORT_APPROVED,
        )
      })

      // One sent it before the report moved on: the row records what the
      // company has, through the usual resume.
      it('finishes a delivery One already sent, whatever the status', async () => {
        reportModel.findOne.mockResolvedValue(
          approvedReport({ status: ReportStatusEnum.APPROVED }),
        )
        mailboxDeliveryService.findDelivery.mockResolvedValue(
          deliveryState({ sent: true, status: MailboxDeliveryStatusEnum.SENT }),
        )

        await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

        expect(mailboxDeliveryService.deliverToMailbox).toHaveBeenCalledTimes(1)
        expect(lastOutboxUpdate()[0]).toEqual(
          expect.objectContaining({
            status: NoticeOutboxStatusEnum.DONE,
            channel: NoticeOutboxChannelEnum.MAILBOX,
          }),
        )
      })

      it.each([
        ['holds a filed document', { documentFiled: true }],
        ['is UNCERTAIN', { status: MailboxDeliveryStatusEnum.UNCERTAIN }],
        ['was interrupted', { interrupted: true }],
        ['is in progress', { inProgress: true }],
      ])(
        'gives a stale notice up for a person when its delivery %s',
        async (_label, state) => {
          reportModel.findOne.mockResolvedValue(
            approvedReport({ status: ReportStatusEnum.APPROVED }),
          )
          mailboxDeliveryService.findDelivery.mockResolvedValue(
            deliveryState({ deliveryId: 'delivery-5', ...state }),
          )

          await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

          expect(mailboxDeliveryService.deliverToMailbox).not.toHaveBeenCalled()
          expect(lastOutboxUpdate()[0]).toEqual(
            expect.objectContaining({
              status: NoticeOutboxStatusEnum.FAILED,
              lastError: expect.stringContaining(
                'delivery-5 may have reached One',
              ),
            }),
          )
        },
      )
    })
  })

  describe('overdue notices', () => {
    it('counts and names the PENDING rows older than the overdue window, outside any transaction', async () => {
      noticeOutboxModel.count.mockResolvedValue(3)
      noticeOutboxModel.findAll.mockResolvedValue([
        {
          ...outboxRow(NoticeOutboxKindEnum.REPORT_APPROVED),
          lastError: 'mailbox delivery delivery-3 has a document in One',
        },
      ])

      await expect(service.findOverdueNotices(1)).resolves.toEqual({
        total: 3,
        notices: [
          {
            noticeId: 'notice-1',
            kind: NoticeOutboxKindEnum.REPORT_APPROVED,
            reportId: 'report-1',
            attempts: 0,
            lastError: 'mailbox delivery delivery-3 has a document in One',
            createdAt: NOW,
          },
        ],
      })

      const [countQuery] = noticeOutboxModel.count.mock.calls[0]
      const [query] = noticeOutboxModel.findAll.mock.calls[0]
      for (const options of [countQuery, query]) {
        expect(options.transaction).toBeNull()
        expect(options.where.status).toBe(NoticeOutboxStatusEnum.PENDING)
        expect(options.where.createdAt).toEqual({
          [Op.lt]: new Date(NOW.getTime() - NOTICE_OVERDUE_AFTER_MS),
        })
        // A quarantined company's rows, and receipts with the flag off, wait
        // by design.
        expect(options.where[Op.and][0].val).toContain('c.quarantined')
        expect(options.where.kind).toEqual({
          [Op.ne]: NoticeOutboxKindEnum.REPORT_SUBMITTED,
        })
      }
      expect(query.order).toEqual([['createdAt', 'ASC']])
      expect(query.limit).toBe(1)
    })

    it('counts receipts while mailbox delivery is on', async () => {
      process.env.ONESYSTEMS_ENABLED = 'true'
      noticeOutboxModel.count.mockResolvedValue(0)

      await expect(service.findOverdueNotices(50)).resolves.toEqual({
        total: 0,
        notices: [],
      })
      expect(
        noticeOutboxModel.count.mock.calls[0][0].where.kind,
      ).toBeUndefined()
      expect(noticeOutboxModel.findAll).not.toHaveBeenCalled()
    })
  })

  describe('mailbox delivery switched off mid-flight', () => {
    const deliveryKey = (kind: MailboxDeliveryKindEnum) =>
      buildMailboxDeliveryIdempotencyKey({
        kind,
        companyId: COMPANY_ID,
        discriminator: 'report-1',
      })

    const dispatch = async (kind: NoticeOutboxKindEnum) => {
      noticeOutboxModel.findAll.mockResolvedValue([outboxRow(kind)])
      return service.dispatchPending(lockTransaction)
    }

    it('looks the delivery up by the key the mailbox path used', async () => {
      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(mailboxDeliveryService.findDelivery).toHaveBeenCalledWith(
        deliveryKey(MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED),
      )
      // Nothing in One: the email goes.
      expect(mailService.sendReportDenied).toHaveBeenCalledTimes(1)
    })

    it('records an approval One already sent as DONE by mailbox, emails nothing and archives', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue({
        deliveryId: 'delivery-1',
        status: MailboxDeliveryStatusEnum.SENT,
        documentFiled: true,
        sent: true,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.DONE,
          channel: NoticeOutboxChannelEnum.MAILBOX,
        }),
      )
      expect(companyFileService.archive).toHaveBeenCalledTimes(1)
    })

    it('gives up on an UNCERTAIN delivery rather than emailing on top of it', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue({
        deliveryId: 'delivery-7',
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        documentFiled: false,
        sent: false,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: expect.stringContaining('delivery-7 is UNCERTAIN'),
        }),
      )
    })

    it('holds a notice whose document One holds unsent, for the flag to come back', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue({
        deliveryId: 'delivery-3',
        status: MailboxDeliveryStatusEnum.FAILED,
        documentFiled: true,
        sent: false,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual({
        lastAttemptAt: NOW,
        lastError: expect.stringContaining('delivery-3 has a document in One'),
      })
    })

    // The predicate is `sent || status === SENT`: a row SENT by status alone
    // still counts as sent.
    it('records a delivery SENT by status, with no sent_at read, as DONE by mailbox', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue(
        deliveryState({ status: MailboxDeliveryStatusEnum.SENT }),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.DONE,
          channel: NoticeOutboxChannelEnum.MAILBOX,
        }),
      )
    })

    // A marker left by a dead process: whether One acted is unknown, as for
    // UNCERTAIN, though the row has not been claimed again to say so.
    it('gives up on a delivery interrupted mid-call rather than emailing on top of it', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue(
        deliveryState({
          deliveryId: 'delivery-8',
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          interrupted: true,
        }),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: expect.stringContaining('delivery-8 was interrupted'),
        }),
      )
    })

    it('holds a notice whose delivery another worker is calling One for', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue(
        deliveryState({ deliveryId: 'delivery-9', inProgress: true }),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(mailService.sendReportDenied).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual({
        lastAttemptAt: NOW,
        lastError: 'mailbox delivery delivery-9 is in progress',
      })
    })

    // Held indefinitely if the flag stays off, so it is logged at warn and
    // named in the daily alert once overdue.
    it('logs the hold on a filed, unsent document at warn', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue(
        deliveryState({ deliveryId: 'delivery-3', documentFiled: true }),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('delivery-3 has a document in One'),
        expect.objectContaining({ noticeId: 'notice-1' }),
      )
    })

    it('emails a notice whose delivery never got past CreateCase', async () => {
      mailboxDeliveryService.findDelivery.mockResolvedValue({
        deliveryId: 'delivery-4',
        status: MailboxDeliveryStatusEnum.FAILED,
        documentFiled: false,
        sent: false,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(mailService.sendReportApproved).toHaveBeenCalledTimes(1)
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.DONE,
          channel: NoticeOutboxChannelEnum.EMAIL,
        }),
      )
    })
  })

  describe('mailbox delivery (ONESYSTEMS_ENABLED on)', () => {
    beforeEach(() => {
      process.env.ONESYSTEMS_ENABLED = 'true'
    })

    const delivered = () => {
      const calls = mailboxDeliveryService.deliverToMailbox.mock.calls
      expect(calls).toHaveLength(1)
      return calls[0][0]
    }

    const dispatch = async (
      kind: NoticeOutboxKindEnum,
      overrides: Partial<{ attempts: number }> = {},
    ) => {
      noticeOutboxModel.findAll.mockResolvedValue([outboxRow(kind, overrides)])
      return service.dispatchPending(lockTransaction)
    }

    const renderedHtml = () => pdfRenderService.renderHtml.mock.calls[0][0]

    it.each([
      [
        NoticeOutboxKindEnum.REPORT_SUBMITTED,
        ReportTypeEnum.SALARY,
        MailboxDeliveryKindEnum.SALARY_REPORT_SUBMITTED,
      ],
      [
        NoticeOutboxKindEnum.REPORT_SUBMITTED,
        ReportTypeEnum.EQUALITY,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_SUBMITTED,
      ],
      [
        NoticeOutboxKindEnum.REPORT_APPROVED,
        ReportTypeEnum.SALARY,
        MailboxDeliveryKindEnum.SALARY_REPORT_APPROVED,
      ],
      [
        NoticeOutboxKindEnum.REPORT_APPROVED,
        ReportTypeEnum.EQUALITY,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_APPROVED,
      ],
      [
        NoticeOutboxKindEnum.REPORT_DENIED,
        ReportTypeEnum.SALARY,
        MailboxDeliveryKindEnum.SALARY_REPORT_DENIED,
      ],
      [
        NoticeOutboxKindEnum.REPORT_DENIED,
        ReportTypeEnum.EQUALITY,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
      ],
    ])(
      '%s for a %s report goes to the filing company as %s, keyed by the report, and is not emailed',
      async (outboxKind, type, kind) => {
        reportModel.findOne.mockResolvedValue(
          approvedReport({ type, status: OWED_STATUS[outboxKind] }),
        )

        await dispatch(outboxKind)

        expect(delivered()).toEqual(
          expect.objectContaining({
            kind,
            companyId: COMPANY_ID,
            idempotencyKey: buildMailboxDeliveryIdempotencyKey({
              kind,
              companyId: COMPANY_ID,
              discriminator: 'report-1',
            }),
          }),
        )
        expect(companyReportModel.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { reportId: 'report-1', parentCompanyId: null },
          }),
        )
        expect(mailService.sendReportApproved).not.toHaveBeenCalled()
        expect(mailService.sendReportDenied).not.toHaveBeenCalled()
        const [values] = lastOutboxUpdate()
        expect(values).toEqual(
          expect.objectContaining({
            status: NoticeOutboxStatusEnum.DONE,
            channel: NoticeOutboxChannelEnum.MAILBOX,
            attempts: 1,
          }),
        )
      },
    )

    it('links the service survey in the letter when the approval completes reporting', async () => {
      // EQUALITY with no salary report owed (the default): the last filing.
      mailboxDeliveryService.deliverToMailbox.mockImplementation(
        async (input: { pdf: () => Promise<Buffer> }) => {
          await input.pdf()
          return {
            status: 'SENT',
            deliveryId: 'delivery-1',
            islandIsDocumentId: 'doc-1',
            sentAt: NOW,
            alreadySent: false,
          }
        },
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(companyReportModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [
            expect.objectContaining({
              attributes: expect.arrayContaining(['salaryReportRequired']),
            }),
          ],
        }),
      )
      expect(renderedHtml()).toContain('Svara könnun')
    })

    it('renders no letter unless the delivery asks for the PDF', async () => {
      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(pdfRenderService.renderHtml).not.toHaveBeenCalled()
      expect(reportPdfService.generateReportPdf).not.toHaveBeenCalled()
      expect(companyFileService.archive).not.toHaveBeenCalled()
    })

    it.each([
      ['resumed past CreateDocument', false],
      ['was already sent', true],
    ])(
      'still archives an approval whose delivery %s, rendering the documents again',
      async (_label, alreadySent) => {
        mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
          status: 'SENT',
          deliveryId: 'delivery-1',
          islandIsDocumentId: 'doc-1',
          sentAt: NOW,
          alreadySent,
        })

        await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

        // No letter: `pdf` never ran. The documents are rendered for the archive.
        expect(pdfRenderService.renderHtml).not.toHaveBeenCalled()
        expect(reportPdfService.generateReportPdf).toHaveBeenCalledTimes(1)
        expect(companyFileService.archive).toHaveBeenCalledWith([
          expect.objectContaining({
            filename: 'jafnrettisaaetlun-report-1.pdf',
            companyNationalId: '5500000000',
            issuedAt: APPROVED_AT,
          }),
        ])
      },
    )

    // The send landed, the DONE write did not. The next run resumes the same
    // delivery by its key, gets `alreadySent`, sends nothing and archives.
    it('records DONE without a second send after a lost DONE write', async () => {
      noticeOutboxModel.update.mockRejectedValueOnce(
        new Error('pool exhausted'),
      )
      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)
      expect(companyFileService.archive).not.toHaveBeenCalled()

      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'SENT',
        deliveryId: 'delivery-1',
        islandIsDocumentId: 'doc-1',
        sentAt: NOW,
        alreadySent: true,
      })
      await service.dispatchPending(lockTransaction)

      const calls = mailboxDeliveryService.deliverToMailbox.mock.calls
      expect(calls).toHaveLength(2)
      expect(calls[1][0].idempotencyKey).toBe(calls[0][0].idempotencyKey)
      expect(mailService.sendReportApproved).not.toHaveBeenCalled()
      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.DONE,
          channel: NoticeOutboxChannelEnum.MAILBOX,
        }),
      )
      expect(companyFileService.archive).toHaveBeenCalledTimes(1)
    })

    it('holds the row, not an attempt, when the company was quarantined after the pick', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'QUARANTINED',
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED, { attempts: 1 })

      expect(lastOutboxUpdate()[0]).toEqual({
        lastAttemptAt: NOW,
        lastError: 'the filing company is quarantined',
      })
    })

    it('gives up as FAILED after the last allowed attempt on the mailbox channel', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'IN_PROGRESS',
        deliveryId: 'delivery-1',
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED, {
        attempts: NOTICE_DISPATCH_MAX_ATTEMPTS - 1,
      })

      expect(lastOutboxUpdate()[0]).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          attempts: NOTICE_DISPATCH_MAX_ATTEMPTS,
          lastError: 'send failed',
        }),
      )
    })

    it('sends a submission receipt letter', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({
          type: ReportTypeEnum.SALARY,
          status: ReportStatusEnum.SUBMITTED,
        }),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

      const input = delivered()
      expect(input.subject).toBe('Skýrslugjöf móttekin')
      await expect(input.pdf()).resolves.toEqual(Buffer.from('letter-pdf'))
      expect(renderedHtml()).toContain('Fyrirtæki ehf.')
      expect(renderedHtml()).toContain('08.10.2026')
    })

    it('merges the approval letter, the report and the úrbótaáætlun into one PDF, then archives the documents', async () => {
      reportModel.findOne.mockResolvedValue(
        approvedReport({ type: ReportTypeEnum.SALARY }),
      )
      reportPdfService.generateImprovementPlanPdf.mockResolvedValue({
        pdf: Buffer.from('plan-bytes'),
        fileName: 'urbotaaaetlun-report-1.pdf',
      })
      mailboxDeliveryService.deliverToMailbox.mockImplementation(
        async (input: { pdf: () => Promise<Buffer> }) => {
          await expect(input.pdf()).resolves.toEqual(Buffer.from('merged-pdf'))
          return {
            status: 'SENT',
            deliveryId: 'delivery-1',
            islandIsDocumentId: 'doc-1',
            sentAt: NOW,
            alreadySent: false,
          }
        },
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(delivered().subject).toBe('Skýrslugjöf samþykkt')
      expect(mergePdfs).toHaveBeenCalledWith([
        Buffer.from('letter-pdf'),
        Buffer.from('pdf-bytes'),
        Buffer.from('plan-bytes'),
      ])
      expect(renderedHtml()).toContain(
        'Fylgiskjöl: jafnlaunaúttekt, úrbótaáætlun.',
      )
      expect(companyFileService.archive).toHaveBeenCalledWith([
        expect.objectContaining({ filename: 'jafnrettisaaetlun-report-1.pdf' }),
        expect.objectContaining({ filename: 'urbotaaaetlun-report-1.pdf' }),
      ])
    })

    it('puts the reviewer’s reason in the denial letter', async () => {
      reportEventModel.findOne.mockResolvedValue({
        reason: 'Vantar <gögn>',
        createdAt: NOW,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      await delivered().pdf()
      expect(renderedHtml()).toContain('Vantar &lt;gögn&gt;')
    })

    it.each([
      [
        'the report is gone',
        () => reportModel.findOne.mockResolvedValue(null),
        NoticeOutboxKindEnum.REPORT_APPROVED,
        'report not found',
      ],
      [
        'no company filed the report',
        () => companyReportModel.findOne.mockResolvedValue(null),
        NoticeOutboxKindEnum.REPORT_APPROVED,
        'filing company not found',
      ],
      [
        'the denial reason is gone',
        () => reportEventModel.findOne.mockResolvedValue(null),
        NoticeOutboxKindEnum.REPORT_DENIED,
        'denial reason not found',
      ],
    ])(
      'gives up without a delivery when %s',
      async (_label, arrange, kind, lastError) => {
        arrange()

        await dispatch(kind)

        expect(mailboxDeliveryService.deliverToMailbox).not.toHaveBeenCalled()
        const [values] = lastOutboxUpdate()
        expect(values).toEqual(
          expect.objectContaining({
            status: NoticeOutboxStatusEnum.FAILED,
            lastError,
          }),
        )
      },
    )

    // Retrying would only return UNCERTAIN again; a person checks One.
    it('gives up on an UNCERTAIN delivery, naming it', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'UNCERTAIN',
        deliveryId: 'delivery-7',
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: expect.stringContaining('delivery-7 is UNCERTAIN'),
        }),
      )
      expect(logger.error).toHaveBeenCalled()
    })

    it('gives up on a delivery that used all its attempts', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'FAILED',
        deliveryId: 'delivery-7',
        attempts: 5,
        skipped: 'ATTEMPTS_EXHAUSTED',
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      const [values] = lastOutboxUpdate()
      expect(values).toEqual(
        expect.objectContaining({
          status: NoticeOutboxStatusEnum.FAILED,
          lastError: expect.stringContaining(
            'delivery-7 used all its attempts',
          ),
        }),
      )
    })

    it.each([
      [
        'a delivery held by another worker',
        { status: 'IN_PROGRESS', deliveryId: 'd' },
      ],
      ['delivery switched off mid-run', { status: 'DISABLED' }],
    ])('retries %s next run', async (_label, result) => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue(result)

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(lastOutboxUpdate()[0]).toEqual({
        attempts: 1,
        lastAttemptAt: NOW,
        lastError: 'send failed',
      })
    })

    // The delivery recorded FAILED or UNCERTAIN on its own row; the next run
    // resumes it by the same key.
    // The flag on before the kind's case template is set: nothing is spent,
    // so nothing is lost, and the hold is loud.
    it('holds the row, not an attempt, at warn, while the kind has no case template', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'UNCONFIGURED',
        kind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
      })

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED, {
        attempts: NOTICE_DISPATCH_MAX_ATTEMPTS - 1,
      })

      expect(lastOutboxUpdate()[0]).toEqual({
        lastAttemptAt: NOW,
        lastError: expect.stringContaining(
          'EQUALITY_REPORT_DENIED has no case template',
        ),
      })
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('has no case template'),
        expect.objectContaining({ noticeId: 'notice-1' }),
      )
    })

    it('renders every letter as a letter', async () => {
      mailboxDeliveryService.deliverToMailbox.mockImplementation(
        async (input: { pdf: () => Promise<Buffer> }) => {
          await input.pdf()
          return {
            status: 'SENT',
            deliveryId: 'delivery-1',
            islandIsDocumentId: 'doc-1',
            sentAt: NOW,
            alreadySent: false,
          }
        },
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_DENIED)

      expect(pdfRenderService.renderHtml).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'letter',
      )
    })

    // The notice went out whole; only the archive copy is lost.
    it('says a failed re-render for the archive cost the archive, not the notice', async () => {
      mailboxDeliveryService.deliverToMailbox.mockResolvedValue({
        status: 'SENT',
        deliveryId: 'delivery-1',
        islandIsDocumentId: 'doc-1',
        sentAt: NOW,
        alreadySent: true,
      })
      reportPdfService.generateReportPdf.mockRejectedValue(
        new Error('chromium is missing'),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_APPROVED)

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('the notice already went out; not archived'),
        expect.anything(),
      )
      expect(logger.error).not.toHaveBeenCalledWith(
        expect.stringContaining('sending the approval notice without it'),
        expect.anything(),
      )
    })

    it('retries a delivery that threw', async () => {
      mailboxDeliveryService.deliverToMailbox.mockRejectedValue(
        new Error('OneSystems CreateDocument failed with HTTP 503'),
      )

      await dispatch(NoticeOutboxKindEnum.REPORT_SUBMITTED)

      expect(lastOutboxUpdate()[0]).toEqual({
        attempts: 1,
        lastAttemptAt: NOW,
        lastError: 'send failed',
      })
    })
  })
})
