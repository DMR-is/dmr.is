import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'

import { buildMailboxDeliveryIdempotencyKey } from '../mailbox-delivery/mailbox-delivery.idempotency-key'
import { MAILBOX_DELIVERY_MAX_ATTEMPTS } from '../mailbox-delivery/mailbox-delivery.service'
import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from '../mailbox-delivery/models/mailbox-delivery.enums'
import {
  NoticeOutboxKindEnum,
  NoticeOutboxStatusEnum,
} from '../notice-outbox/models/notice-outbox.enums'
import { ReportTypeEnum } from '../report/models/report.model'
import { NoticeIssuesService } from './notice-issues.service'

const REPORT_ID = '9feed2d2-c9cb-46cc-8c25-3b11a161a6b7'
const COMPANY_ID = '5f0c0b9e-2d3a-4b6c-8e1f-0a1b2c3d4e5f'
const NOTICE_ID = '8a866f95-d105-463d-98e5-e1c366ebb034'
const DELIVERY_ID = '05bcda52-69e1-48af-be42-28ec483e2ce0'
const ACTOR = { id: 'user-1', name: 'Anna Jónsdóttir' }

const DENIED_KEY = buildMailboxDeliveryIdempotencyKey({
  kind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
  companyId: COMPANY_ID,
  discriminator: REPORT_ID,
})

const AUDIT =
  /^(Re-armed|Reconciled) by Anna Jónsdóttir \(user-1\) on \d{4}-\d{2}-\d{2}$/

const notice = (overrides: Record<string, unknown> = {}) => ({
  id: NOTICE_ID,
  kind: NoticeOutboxKindEnum.REPORT_DENIED,
  status: NoticeOutboxStatusEnum.FAILED,
  reportId: REPORT_ID,
  attempts: 5,
  lastError: 'send failed',
  createdAt: new Date('2026-11-11T14:00:00Z'),
  processedAt: new Date('2026-11-11T14:30:00Z'),
  ...overrides,
})

const delivery = (overrides: Record<string, unknown> = {}) => ({
  id: DELIVERY_ID,
  kind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DENIED,
  companyId: COMPANY_ID,
  idempotencyKey: DENIED_KEY,
  status: MailboxDeliveryStatusEnum.FAILED,
  attempts: 1,
  inFlightStep: null,
  leaseExpiresAt: null,
  oneCaseNumber: null,
  oneDocumentItemId: null,
  lastError: 'CreateDocument REJECTED: may echo the recipient kennitala',
  lastErrorNumber: null,
  lastAttemptAt: new Date('2026-11-11T14:30:00Z'),
  sentAt: null,
  ...overrides,
})

describe('NoticeIssuesService', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  let notices: {
    findAll: jest.Mock
    findByPk: jest.Mock
    findOne: jest.Mock
    update: jest.Mock
    count: jest.Mock
  }
  let deliveries: { findAll: jest.Mock; findByPk: jest.Mock }
  let reports: { findAll: jest.Mock }
  let companyReports: { findAll: jest.Mock }
  let companies: { findAll: jest.Mock }
  let dispatch: { findOverdueNotices: jest.Mock }
  let mailbox: {
    findStuckDeliveries: jest.Mock
    countStuckDeliveries: jest.Mock
    rearmExhausted: jest.Mock
    settleUncertain: jest.Mock
    checkConnection: jest.Mock
  }
  let service: NoticeIssuesService

  beforeEach(() => {
    jest.clearAllMocks()
    notices = {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(notice()),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
      count: jest.fn().mockResolvedValue(0),
    }
    deliveries = {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(null),
    }
    reports = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: REPORT_ID,
          type: ReportTypeEnum.EQUALITY,
          identifier: 'KTPQZW',
        },
      ]),
    }
    companyReports = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ reportId: REPORT_ID, companyId: COMPANY_ID }]),
    }
    companies = {
      findAll: jest
        .fn()
        .mockResolvedValue([{ id: COMPANY_ID, name: 'Jafnréttisstofa' }]),
    }
    dispatch = {
      findOverdueNotices: jest
        .fn()
        .mockResolvedValue({ total: 0, notices: [] }),
    }
    mailbox = {
      findStuckDeliveries: jest.fn().mockResolvedValue([]),
      countStuckDeliveries: jest.fn().mockResolvedValue({
        UNCERTAIN: 0,
        INTERRUPTED: 0,
        ATTEMPTS_EXHAUSTED: 0,
      }),
      rearmExhausted: jest.fn().mockResolvedValue(true),
      settleUncertain: jest.fn().mockResolvedValue(true),
      checkConnection: jest
        .fn()
        .mockResolvedValue({ ok: true, reason: null, checkedAt: new Date() }),
    }
    service = new NoticeIssuesService(
      logger as never,
      notices as never,
      deliveries as never,
      reports as never,
      companyReports as never,
      companies as never,
      dispatch as never,
      mailbox as never,
    )
  })

  const REDRIVEN = {
    status: NoticeOutboxStatusEnum.PENDING,
    processedAt: null,
    channel: null,
    attempts: 0,
    lastAttemptAt: null,
    lastError: null,
  }

  describe('getIssues', () => {
    it('lists a failed notice with its report, company and delivery, without the delivery last_error', async () => {
      notices.findAll.mockResolvedValueOnce([notice()])
      notices.count.mockResolvedValueOnce(1)
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      ])

      const issues = await service.getIssues()

      expect(issues.failed).toHaveLength(1)
      expect(issues.failedTotal).toBe(1)
      expect(issues.failed[0]).toMatchObject({
        id: NOTICE_ID,
        reportIdentifier: 'KTPQZW',
        companyName: 'Jafnréttisstofa',
        delivery: {
          id: DELIVERY_ID,
          exhausted: true,
          needsReconciling: false,
          inProgress: false,
          uncertainStep: null,
        },
      })
      expect(JSON.stringify(issues)).not.toContain('kennitala')
      expect(deliveries.findAll).toHaveBeenCalledWith({
        where: { idempotencyKey: [DENIED_KEY] },
      })
    })

    it('lists failed notices oldest first, with no time window', async () => {
      await service.getIssues()

      expect(notices.findAll).toHaveBeenCalledWith({
        where: { status: NoticeOutboxStatusEnum.FAILED },
        order: [['processedAt', 'ASC']],
        limit: 100,
      })
    })

    it('returns the totals behind each list', async () => {
      notices.count.mockResolvedValueOnce(250)
      dispatch.findOverdueNotices.mockResolvedValueOnce({
        total: 120,
        notices: [],
      })
      mailbox.countStuckDeliveries.mockResolvedValueOnce({
        UNCERTAIN: 2,
        INTERRUPTED: 1,
        ATTEMPTS_EXHAUSTED: 4,
      })

      const issues = await service.getIssues()

      expect(issues).toMatchObject({
        failedTotal: 250,
        overdueTotal: 120,
        remindersTotal: 7,
      })
      expect(mailbox.countStuckDeliveries).toHaveBeenCalledWith([
        MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
      ])
    })

    it.each([
      [
        'an interrupted CreateDocument',
        {
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          leaseExpiresAt: new Date(Date.now() - 60_000),
        },
        MailboxDeliveryStepEnum.CREATE_DOCUMENT,
      ],
      [
        'an UNCERTAIN row with no document',
        { status: MailboxDeliveryStatusEnum.UNCERTAIN },
        MailboxDeliveryStepEnum.CREATE_DOCUMENT,
      ],
      [
        'an UNCERTAIN row with a document',
        {
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          oneDocumentItemId: 'doc-1',
        },
        MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
      ],
    ])(
      'flags %s as needing reconciling and names the step in doubt',
      async (_what, overrides, step) => {
        notices.findAll.mockResolvedValueOnce([notice()])
        deliveries.findAll.mockResolvedValueOnce([delivery(overrides)])

        const issues = await service.getIssues()

        expect(issues.failed[0].delivery).toMatchObject({
          needsReconciling: true,
          inProgress: false,
          exhausted: false,
          uncertainStep: step,
        })
      },
    )

    it('lists only reminder deliveries among the stuck ones', async () => {
      mailbox.findStuckDeliveries.mockResolvedValueOnce([{ deliveryId: 'd-1' }])
      deliveries.findAll.mockResolvedValueOnce([
        delivery({
          id: 'd-1',
          kind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
        }),
      ])

      const issues = await service.getIssues()

      expect(mailbox.findStuckDeliveries).toHaveBeenCalledWith(100, [
        MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
      ])
      expect(issues.reminders).toEqual([
        expect.objectContaining({
          companyName: 'Jafnréttisstofa',
          delivery: expect.objectContaining({ needsReconciling: true }),
        }),
      ])
    })
  })

  describe('getRecentDeliveries', () => {
    it('lists the latest sent letters with their company, newest first', async () => {
      deliveries.findAll.mockResolvedValueOnce([
        delivery({
          status: MailboxDeliveryStatusEnum.SENT,
          sentAt: new Date('2026-11-12T11:00:00Z'),
          oneDocumentItemId: 'doc-1',
        }),
      ])

      const recent = await service.getRecentDeliveries()

      expect(deliveries.findAll).toHaveBeenCalledWith({
        where: { status: MailboxDeliveryStatusEnum.SENT },
        order: [['sentAt', 'DESC']],
        limit: 20,
      })
      expect(recent).toEqual([
        expect.objectContaining({
          companyName: 'Jafnréttisstofa',
          delivery: expect.objectContaining({ id: DELIVERY_ID }),
        }),
      ])
      expect(JSON.stringify(recent)).not.toContain('kennitala')
    })
  })

  describe('checkOneSystems', () => {
    it('passes the result through with the time of the real Login', async () => {
      const checkedAt = new Date('2026-11-12T10:00:00Z')
      mailbox.checkConnection.mockResolvedValueOnce({
        ok: false,
        reason: 'Login HTTP 401',
        checkedAt,
      })

      await expect(service.checkOneSystems(ACTOR)).resolves.toEqual({
        ok: false,
        reason: 'Login HTTP 401',
        checkedAt,
      })
    })
  })

  describe('retryNotice', () => {
    it('refuses a notice that does not exist', async () => {
      notices.findByPk.mockResolvedValueOnce(null)

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toThrow(
        NotFoundException,
      )
    })

    it('tells the admin why in Icelandic', async () => {
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ status: MailboxDeliveryStatusEnum.UNCERTAIN }),
      ])

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toMatchObject(
        {
          response: {
            translatedMessage: expect.stringContaining('Staðfestu stöðuna'),
          },
        },
      )
    })

    it('refuses a notice that is not FAILED', async () => {
      notices.findByPk.mockResolvedValueOnce(
        notice({ status: NoticeOutboxStatusEnum.PENDING }),
      )

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toThrow(
        ConflictException,
      )
      expect(notices.update).not.toHaveBeenCalled()
    })

    it('re-drives a notice that has no delivery (an email failure)', async () => {
      await service.retryNotice(NOTICE_ID, ACTOR)

      expect(mailbox.rearmExhausted).not.toHaveBeenCalled()
      expect(notices.update).toHaveBeenCalledWith(REDRIVEN, {
        where: { id: NOTICE_ID, status: NoticeOutboxStatusEnum.FAILED },
        transaction: null,
      })
    })

    it('re-arms an exhausted delivery through the mailbox module, then re-drives the notice', async () => {
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      ])

      await service.retryNotice(NOTICE_ID, ACTOR)

      expect(mailbox.rearmExhausted).toHaveBeenCalledWith(
        DELIVERY_ID,
        MailboxDeliveryStatusEnum.FAILED,
        expect.stringMatching(AUDIT),
      )
      expect(notices.update.mock.calls[0][0]).toEqual(REDRIVEN)
    })

    it('refuses when the re-arm finds the delivery moved', async () => {
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      ])
      mailbox.rearmExhausted.mockResolvedValueOnce(false)

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toThrow(
        ConflictException,
      )
      expect(notices.update).not.toHaveBeenCalled()
    })

    it('leaves a delivery with attempts left as it is', async () => {
      deliveries.findAll.mockResolvedValueOnce([delivery({ attempts: 2 })])

      await service.retryNotice(NOTICE_ID, ACTOR)

      expect(mailbox.rearmExhausted).not.toHaveBeenCalled()
      expect(notices.update.mock.calls[0][0]).toEqual(REDRIVEN)
    })

    it.each([
      ['UNCERTAIN', { status: MailboxDeliveryStatusEnum.UNCERTAIN }],
      [
        'interrupted',
        {
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          leaseExpiresAt: null,
        },
      ],
      ['in progress', { leaseExpiresAt: new Date(Date.now() + 60_000) }],
    ])('refuses while the delivery is %s', async (_state, overrides) => {
      deliveries.findAll.mockResolvedValueOnce([delivery(overrides)])

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toThrow(
        ConflictException,
      )
      expect(mailbox.rearmExhausted).not.toHaveBeenCalled()
      expect(notices.update).not.toHaveBeenCalled()
    })

    it('refuses when the notice changed meanwhile', async () => {
      notices.update.mockResolvedValueOnce([0])

      await expect(service.retryNotice(NOTICE_ID, ACTOR)).rejects.toThrow(
        ConflictException,
      )
    })
  })

  describe('reconcileDelivery', () => {
    const uncertain = (overrides: Record<string, unknown> = {}) =>
      delivery({ status: MailboxDeliveryStatusEnum.UNCERTAIN, ...overrides })

    const READ = {
      status: MailboxDeliveryStatusEnum.UNCERTAIN,
      inFlightStep: null,
      oneDocumentItemId: null,
      sentAt: null,
    }

    it('refuses a delivery that does not exist', async () => {
      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'SENT' }, ACTOR),
      ).rejects.toThrow(NotFoundException)
    })

    it('refuses a delivery that needs no reconciling', async () => {
      deliveries.findByPk.mockResolvedValueOnce(delivery())

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'SENT' }, ACTOR),
      ).rejects.toThrow(ConflictException)
      expect(mailbox.settleUncertain).not.toHaveBeenCalled()
    })

    it('refuses SENT without a document id', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'SENT' }, ACTOR),
      ).rejects.toThrow(BadRequestException)
      expect(mailbox.settleUncertain).not.toHaveBeenCalled()
    })

    it('settles SENT through the mailbox module with what it read, then re-drives its FAILED notice', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())
      notices.findOne.mockResolvedValueOnce(notice())

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'SENT', documentItemId: 'doc-9' },
        ACTOR,
      )

      expect(mailbox.settleUncertain).toHaveBeenCalledWith(
        DELIVERY_ID,
        READ,
        'SENT',
        'doc-9',
        expect.stringMatching(AUDIT),
      )
      expect(notices.findOne).toHaveBeenCalledWith({
        where: {
          reportId: REPORT_ID,
          kind: NoticeOutboxKindEnum.REPORT_DENIED,
          status: NoticeOutboxStatusEnum.FAILED,
        },
      })
      expect(notices.update.mock.calls[0][0]).toEqual(REDRIVEN)
    })

    it('keeps a saved document id over the one given', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        uncertain({ oneDocumentItemId: 'doc-saved' }),
      )

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'SENT', documentItemId: 'doc-other' },
        ACTOR,
      )

      expect(mailbox.settleUncertain.mock.calls[0][3]).toBe('doc-saved')
    })

    it('settles an interrupted delivery with its marker as read', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        delivery({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        }),
      )

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'NOT_SENT' },
        ACTOR,
      )

      expect(mailbox.settleUncertain).toHaveBeenCalledWith(
        DELIVERY_ID,
        {
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          oneDocumentItemId: null,
          sentAt: null,
        },
        'NOT_SENT',
        null,
        expect.stringMatching(AUDIT),
      )
    })

    it('refuses NOT_SENT once One confirmed the send', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        uncertain({ sentAt: new Date(), oneDocumentItemId: 'doc-1' }),
      )

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'NOT_SENT' }, ACTOR),
      ).rejects.toThrow(ConflictException)
      expect(mailbox.settleUncertain).not.toHaveBeenCalled()
    })

    it('refuses while a worker holds the lease', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        delivery({
          inFlightStep: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
          leaseExpiresAt: new Date(Date.now() + 60_000),
        }),
      )

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'NOT_SENT' }, ACTOR),
      ).rejects.toThrow(ConflictException)
    })

    it('refuses when the delivery changed meanwhile', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())
      mailbox.settleUncertain.mockResolvedValueOnce(false)

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'NOT_SENT' }, ACTOR),
      ).rejects.toThrow(ConflictException)
      expect(notices.update).not.toHaveBeenCalled()
    })

    it('touches no notice for a reminder delivery', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        uncertain({
          kind: MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
        }),
      )

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'NOT_SENT' },
        ACTOR,
      )

      expect(notices.findOne).not.toHaveBeenCalled()
      expect(notices.update).not.toHaveBeenCalled()
    })

    it('leaves a notice that is not FAILED to the dispatcher', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'NOT_SENT' },
        ACTOR,
      )

      expect(notices.findOne).toHaveBeenCalled()
      expect(notices.update).not.toHaveBeenCalled()
    })
  })
})
