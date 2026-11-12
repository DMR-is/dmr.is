import { literal, Op } from 'sequelize'

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

/** No live lease, on Postgres's clock. */
const LEASE_FREE = {
  [Op.or]: [
    { leaseExpiresAt: null },
    { leaseExpiresAt: { [Op.lt]: literal('CURRENT_TIMESTAMP') } },
  ],
}

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
  }
  let deliveries: { findAll: jest.Mock; findByPk: jest.Mock; update: jest.Mock }
  let reports: { findAll: jest.Mock }
  let companyReports: { findAll: jest.Mock }
  let companies: { findAll: jest.Mock }
  let dispatch: { findOverdueNotices: jest.Mock }
  let mailbox: { findStuckDeliveries: jest.Mock }
  let service: NoticeIssuesService

  beforeEach(() => {
    jest.clearAllMocks()
    notices = {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(notice()),
      findOne: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
    }
    deliveries = {
      findAll: jest.fn().mockResolvedValue([]),
      findByPk: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue([1]),
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
    mailbox = { findStuckDeliveries: jest.fn().mockResolvedValue([]) }
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

  const noticeUpdate = () => notices.update.mock.calls[0]
  const deliveryUpdate = () => deliveries.update.mock.calls[0]

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
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      ])

      const issues = await service.getIssues()

      expect(issues.failed).toHaveLength(1)
      expect(issues.failed[0]).toMatchObject({
        id: NOTICE_ID,
        reportIdentifier: 'KTPQZW',
        companyName: 'Jafnréttisstofa',
        delivery: {
          id: DELIVERY_ID,
          exhausted: true,
          needsReconciling: false,
          inProgress: false,
        },
      })
      expect(JSON.stringify(issues)).not.toContain('kennitala')
      expect(deliveries.findAll).toHaveBeenCalledWith({
        where: { idempotencyKey: [DENIED_KEY] },
      })
    })

    it('flags an interrupted delivery as needing reconciling', async () => {
      notices.findAll.mockResolvedValueOnce([notice()])
      deliveries.findAll.mockResolvedValueOnce([
        delivery({
          inFlightStep: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
          leaseExpiresAt: new Date(Date.now() - 60_000),
        }),
      ])

      const issues = await service.getIssues()

      expect(issues.failed[0].delivery).toMatchObject({
        needsReconciling: true,
        inProgress: false,
        exhausted: false,
      })
    })

    it('lists only reminder deliveries among the stuck ones', async () => {
      mailbox.findStuckDeliveries.mockResolvedValueOnce([
        { deliveryId: 'd-1' },
        { deliveryId: 'd-2' },
      ])
      deliveries.findAll.mockResolvedValueOnce([
        delivery({
          id: 'd-1',
          kind: MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
        }),
      ])

      const issues = await service.getIssues()

      // Filtered in the query, so stuck notice deliveries cannot use up the
      // limit and hide every reminder.
      expect(mailbox.findStuckDeliveries).toHaveBeenCalledWith(100, [
        MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
        MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
      ])
      expect(deliveries.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: ['d-1', 'd-2'],
            kind: [
              MailboxDeliveryKindEnum.SALARY_REPORT_DEADLINE_REMINDER,
              MailboxDeliveryKindEnum.EQUALITY_REPORT_DEADLINE_REMINDER,
            ],
          },
        }),
      )
      expect(issues.reminders).toEqual([
        expect.objectContaining({
          companyName: 'Jafnréttisstofa',
          delivery: expect.objectContaining({ needsReconciling: true }),
        }),
      ])
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
            translatedMessage: expect.stringContaining('Staðfestið stöðuna'),
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

      expect(deliveries.update).not.toHaveBeenCalled()
      expect(noticeUpdate()).toEqual([
        REDRIVEN,
        {
          where: { id: NOTICE_ID, status: NoticeOutboxStatusEnum.FAILED },
          transaction: null,
        },
      ])
    })

    it('re-arms an exhausted delivery, then re-drives the notice', async () => {
      deliveries.findAll.mockResolvedValueOnce([
        delivery({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      ])

      await service.retryNotice(NOTICE_ID, ACTOR)

      expect(deliveryUpdate()).toEqual([
        {
          attempts: 0,
          lastError: expect.stringMatching(
            /^Re-armed by Anna Jónsdóttir \(user-1\) on \d{4}-\d{2}-\d{2}$/,
          ),
        },
        {
          where: {
            id: DELIVERY_ID,
            status: MailboxDeliveryStatusEnum.FAILED,
            inFlightStep: null,
            attempts: { [Op.gte]: MAILBOX_DELIVERY_MAX_ATTEMPTS },
            ...LEASE_FREE,
          },
          transaction: null,
        },
      ])
      expect(noticeUpdate()[0]).toEqual(REDRIVEN)
    })

    it('leaves a delivery with attempts left as it is', async () => {
      deliveries.findAll.mockResolvedValueOnce([delivery({ attempts: 2 })])

      await service.retryNotice(NOTICE_ID, ACTOR)

      expect(deliveries.update).not.toHaveBeenCalled()
      expect(noticeUpdate()[0]).toEqual(REDRIVEN)
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
      expect(deliveries.update).not.toHaveBeenCalled()
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
      expect(deliveries.update).not.toHaveBeenCalled()
    })

    it('refuses SENT without a document id', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'SENT' }, ACTOR),
      ).rejects.toThrow(BadRequestException)
      expect(deliveries.update).not.toHaveBeenCalled()
    })

    it('records SENT with the given document id, then re-drives its FAILED notice', async () => {
      deliveries.findByPk.mockResolvedValueOnce(uncertain())
      notices.findOne.mockResolvedValueOnce(notice())

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'SENT', documentItemId: 'doc-9' },
        ACTOR,
      )

      expect(deliveryUpdate()).toEqual([
        expect.objectContaining({
          status: MailboxDeliveryStatusEnum.SENT,
          oneDocumentItemId: 'doc-9',
          sentAt: expect.any(Date),
          inFlightStep: null,
          leaseToken: null,
          leaseExpiresAt: null,
          lastError: expect.stringMatching(
            /^Reconciled by Anna Jónsdóttir \(user-1\) on .*: sent$/,
          ),
        }),
        {
          where: {
            id: DELIVERY_ID,
            status: MailboxDeliveryStatusEnum.UNCERTAIN,
            inFlightStep: null,
            // A late reply saving either would make the write miss.
            oneDocumentItemId: null,
            sentAt: null,
            ...LEASE_FREE,
          },
          transaction: null,
        },
      ])
      expect(notices.findOne).toHaveBeenCalledWith({
        where: {
          reportId: REPORT_ID,
          kind: NoticeOutboxKindEnum.REPORT_DENIED,
          status: NoticeOutboxStatusEnum.FAILED,
        },
      })
      expect(noticeUpdate()[0]).toEqual(REDRIVEN)
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

      expect(deliveryUpdate()[0]).toMatchObject({
        oneDocumentItemId: 'doc-saved',
      })
    })

    it('lets NOT_SENT go again with its attempts back, from the document when known', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        uncertain({ attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS }),
      )

      await service.reconcileDelivery(
        DELIVERY_ID,
        { outcome: 'NOT_SENT', documentItemId: 'doc-9' },
        ACTOR,
      )

      expect(deliveryUpdate()[0]).toEqual(
        expect.objectContaining({
          status: MailboxDeliveryStatusEnum.FAILED,
          oneDocumentItemId: 'doc-9',
          attempts: 0,
          inFlightStep: null,
          lastError: expect.stringMatching(/: filed, not sent$/),
        }),
      )
    })

    it('clears the marker of an interrupted delivery', async () => {
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

      expect(deliveryUpdate()).toEqual([
        expect.objectContaining({
          status: MailboxDeliveryStatusEnum.FAILED,
          inFlightStep: null,
          oneDocumentItemId: null,
          lastError: expect.stringMatching(/: not sent$/),
        }),
        {
          where: {
            id: DELIVERY_ID,
            status: MailboxDeliveryStatusEnum.CASE_CREATED,
            inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
            oneDocumentItemId: null,
            sentAt: null,
            ...LEASE_FREE,
          },
          transaction: null,
        },
      ])
    })

    it('refuses NOT_SENT once One confirmed the send', async () => {
      deliveries.findByPk.mockResolvedValueOnce(
        uncertain({ sentAt: new Date(), oneDocumentItemId: 'doc-1' }),
      )

      await expect(
        service.reconcileDelivery(DELIVERY_ID, { outcome: 'NOT_SENT' }, ACTOR),
      ).rejects.toThrow(ConflictException)
      expect(deliveries.update).not.toHaveBeenCalled()
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
      deliveries.update.mockResolvedValueOnce([0])

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
