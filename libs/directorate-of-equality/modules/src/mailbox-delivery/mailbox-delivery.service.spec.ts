import { createHash } from 'crypto'
import { Op } from 'sequelize'

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import {
  IOneSystemsService,
  ONESYSTEMS_DOCUMENT_TIMEOUT_MS,
  ONESYSTEMS_REQUEST_TIMEOUT_MS,
  OneSystemsError,
  type OneSystemsOperation,
  oneSystemsTimeoutMs,
} from '@dmr.is/clients-onesystems'

import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from './models/mailbox-delivery.enums'
import { buildMailboxDeliveryIdempotencyKey } from './mailbox-delivery.idempotency-key'
import {
  isKindConfigured,
  MAILBOX_DELIVERY_KINDS,
  MAILBOX_DELIVERY_KINDS_IN_USE,
  type MailboxDeliveryKindConfigs,
  resolveKindConfig,
} from './mailbox-delivery.kinds'
import {
  LOGIN_RETRY_AFTER_MS,
  MAILBOX_DELIVERY_LEASE_MINUTES,
  MAILBOX_DELIVERY_MAX_ATTEMPTS,
  MAILBOX_DELIVERY_SLOWEST_CALL_MS,
  MailboxDeliveryService,
} from './mailbox-delivery.service'
import { DeliverToMailboxInput } from './mailbox-delivery.service.interface'

/** Placeholder kennitala: shape only, never checksum-valid. */
const COMPANY = {
  id: '5f0c2f7e-9d2b-4c55-8f0a-2b7c8b1e4a10',
  name: 'Fyrirtæki ehf.',
  nationalId: '1111111111',
}

const OTHER_COMPANY_ID = '6a1d3f8f-0e3c-4d66-9f1b-3c8d9c2f5b21'

const keyFor = (
  discriminator: string,
  kind = MailboxDeliveryKindEnum.OVERDUE_NOTICE,
  companyId = COMPANY.id,
) => buildMailboxDeliveryIdempotencyKey({ kind, companyId, discriminator })

const KEY = keyFor('SALARY-20270301')

const PREFIX = `mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY.id}:`

const CONFIG = {
  caseType: 'case-type',
  docCategory: 'doc-category',
  docType: 'doc-type',
  author: 'Jafnréttisstofa',
  islandIsCategory: 'island-category',
  islandIsType: 'island-type',
}

const KINDS = Object.fromEntries(
  Object.values(MailboxDeliveryKindEnum).map((kind) => [kind, CONFIG]),
) as MailboxDeliveryKindConfigs

const PDF = Buffer.from('%PDF-1.7 notice')
const PDF_SHA256 = createHash('sha256').update(PDF).digest('hex')

const MINUTE = 60_000

type Row = Record<string, unknown> & { id: string }

type StoreUpdate = ReturnType<typeof createStore>['model']['update']

const isLiteral = (value: unknown): value is { val: string } =>
  typeof value === 'object' &&
  value !== null &&
  !(value instanceof Date) &&
  'val' in value

/** Stands in for the SQL fragments the service sends as literals. */
function evaluate(value: unknown, row: Row): unknown {
  if (!isLiteral(value)) {
    return value
  }
  if (value.val === 'attempts + 1') {
    return (row.attempts as number) + 1
  }
  if (value.val === 'GREATEST(attempts - 1, 0)') {
    return Math.max((row.attempts as number) - 1, 0)
  }
  if (value.val.includes('INTERVAL')) {
    expect(value.val).toBe(
      `CURRENT_TIMESTAMP + INTERVAL '${MAILBOX_DELIVERY_LEASE_MINUTES} minutes'`,
    )
    return new Date(Date.now() + MAILBOX_DELIVERY_LEASE_MINUTES * MINUTE)
  }
  if (value.val === 'CURRENT_TIMESTAMP') {
    return new Date()
  }
  throw new Error(`Unexpected literal ${value.val}`)
}

/** Enough of Sequelize's WHERE semantics for the service's own predicates. */
function matches(row: Row, where: Record<string | symbol, unknown>): boolean {
  return Reflect.ownKeys(where).every((key) => {
    const condition = where[key as string]
    if (key === Op.or) {
      return (condition as Array<Record<string, unknown>>).some((branch) =>
        matches(row, branch),
      )
    }
    if (key === Op.and) {
      return (condition as Array<Record<string, unknown>>).every((branch) =>
        matches(row, branch),
      )
    }
    const actual = row[key as string]
    if (condition === null) {
      return actual === null || actual === undefined
    }
    if (
      typeof condition === 'object' &&
      !(condition instanceof Date) &&
      !isLiteral(condition)
    ) {
      const ops = condition as Record<symbol, unknown>
      if (Op.notIn in ops) {
        return !(ops[Op.notIn] as Array<unknown>).includes(actual)
      }
      if (Op.ne in ops) {
        // Sequelize writes `{ [Op.ne]: null }` as IS NOT NULL.
        return ops[Op.ne] === null
          ? actual !== null && actual !== undefined
          : actual !== ops[Op.ne]
      }
      if (Op.lt in ops) {
        const bound = evaluate(ops[Op.lt], row)
        if (typeof bound === 'number') {
          return typeof actual === 'number' && actual < bound
        }
        return (
          actual instanceof Date && actual.getTime() < (bound as Date).getTime()
        )
      }
      if (Op.gte in ops) {
        const bound = ops[Op.gte] as number
        return typeof actual === 'number' && actual >= bound
      }
      throw new Error(`Unexpected operator on ${String(key)}`)
    }
    return actual === condition
  })
}

/**
 * An in-memory `mailbox_delivery`. Reads hand out copies, as Sequelize hands
 * out instances, so the service works from a snapshot and the store is the
 * truth. Every call's options are kept for the `transaction: null` check.
 */
function createStore() {
  const rows = new Map<string, Row>()
  let nextId = 1

  const seed = (overrides: Partial<Row> = {}): Row => {
    const row: Row = {
      id: `delivery-${nextId++}`,
      companyId: COMPANY.id,
      nationalId: COMPANY.nationalId,
      kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
      idempotencyKey: KEY,
      subject: 'Áminning',
      status: MailboxDeliveryStatusEnum.PENDING,
      inFlightStep: null,
      oneCaseNumber: null,
      oneCaseItemId: null,
      oneDocumentItemId: null,
      islandIsDocumentId: null,
      pdfSha256: null,
      pdfSizeBytes: null,
      attempts: 0,
      lastAttemptAt: null,
      lastError: null,
      lastErrorNumber: null,
      leaseToken: null,
      leaseExpiresAt: null,
      sentAt: null,
      ...overrides,
    }
    rows.set(row.id, row)
    return row
  }

  const model = {
    bulkCreate: jest.fn(
      async (records: Array<Record<string, unknown>>, _options: unknown) => {
        for (const record of records) {
          const taken = [...rows.values()].some(
            (row) => row.idempotencyKey === record.idempotencyKey,
          )
          if (!taken) {
            seed(record)
          }
        }
        return []
      },
    ),
    findOne: jest.fn(
      async (options: { where: Record<string | symbol, unknown> }) => {
        const row = [...rows.values()].find((r) => matches(r, options.where))
        return row ? { ...row } : null
      },
    ),
    count: jest.fn(
      async (options: { where: Record<string | symbol, unknown> }) =>
        [...rows.values()].filter((r) => matches(r, options.where)).length,
    ),
    findAll: jest.fn(
      async (options: {
        where: Record<string | symbol, unknown>
        limit?: number
      }) =>
        [...rows.values()]
          .filter((r) => matches(r, options.where))
          .slice(0, options.limit)
          .map((r) => ({ ...r })),
    ),
    update: jest.fn(
      async (
        values: Record<string, unknown>,
        options: {
          where: Record<string | symbol, unknown>
          returning?: boolean
        },
      ) => {
        const hit = [...rows.values()].filter((r) => matches(r, options.where))
        for (const row of hit) {
          const next = Object.fromEntries(
            Object.entries(values).map(([k, v]) => [k, evaluate(v, row)]),
          )
          Object.assign(row, next)
        }
        return options.returning
          ? [hit.length, hit.map((r) => ({ ...r }))]
          : [hit.length]
      },
    ),
  }

  return { rows, seed, model }
}

const rejected = (operation: OneSystemsOperation) =>
  new OneSystemsError(`${operation} was rejected`, {
    operation,
    reason: 'REJECTED',
    errorNumber: '42',
    errorMessage: 'Rangt skjal',
  })

const transport = (operation: OneSystemsOperation) =>
  new OneSystemsError(`${operation} did not answer`, {
    operation,
    reason: 'TRANSPORT',
  })

const http = (
  operation: OneSystemsOperation,
  upstreamStatus: number,
  body: {
    isValidationProblemBody?: boolean
    hasEmptyBody?: boolean
    hasBearerChallenge?: boolean
  } = {},
) =>
  new OneSystemsError(`${operation} answered ${upstreamStatus}`, {
    operation,
    reason: 'HTTP',
    upstreamStatus,
    ...body,
  })

describe('MailboxDeliveryService', () => {
  const originalEnabled = process.env.ONESYSTEMS_ENABLED

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  let store: ReturnType<typeof createStore>
  let companies: { findOne: jest.Mock }
  let configs: { findOne: jest.Mock }
  let one: jest.Mocked<IOneSystemsService>
  let pdf: jest.Mock<Promise<Buffer>, []>
  let service: MailboxDeliveryService

  const build = (kinds: MailboxDeliveryKindConfigs = KINDS) =>
    new MailboxDeliveryService(
      logger as never,
      store.model as never,
      companies as never,
      configs as never,
      one,
      kinds,
    )

  const input = (
    overrides: Partial<DeliverToMailboxInput> = {},
  ): DeliverToMailboxInput => ({
    idempotencyKey: KEY,
    kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
    companyId: COMPANY.id,
    subject: 'Áminning',
    pdf,
    ...overrides,
  })

  const onlyRow = () => {
    expect(store.rows.size).toBe(1)
    return [...store.rows.values()][0]
  }

  const oneCalls = () =>
    one.createCase.mock.calls.length +
    one.createDocument.mock.calls.length +
    one.sendDocToIslandIs.mock.calls.length +
    one.closeCase.mock.calls.length

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ONESYSTEMS_ENABLED = 'true'
    store = createStore()
    companies = { findOne: jest.fn().mockResolvedValue({ ...COMPANY }) }
    // Every company, so the rest of the suite is about delivery, not the
    // allowlist; `describe('allowlist')` narrows it.
    configs = { findOne: jest.fn().mockResolvedValue({ value: '*' }) }
    one = {
      checkLogin: jest.fn().mockResolvedValue(undefined),
      createCase: jest.fn(),
      createDocument: jest.fn(),
      sendDocToIslandIs: jest.fn(),
      closeCase: jest.fn(),
    }
    one.createCase.mockResolvedValue({
      caseItemId: 'case-1',
      caseNumber: 'JAF-2026-1',
    })
    one.createDocument.mockResolvedValue({ documentItemId: 'doc-1' })
    one.sendDocToIslandIs.mockResolvedValue({
      islandIsDocumentId: 'island-1',
      alreadyInMailbox: false,
    })
    pdf = jest.fn().mockResolvedValue(PDF)
    service = build()
  })

  afterAll(() => {
    if (originalEnabled === undefined) {
      delete process.env.ONESYSTEMS_ENABLED
    } else {
      process.env.ONESYSTEMS_ENABLED = originalEnabled
    }
  })

  describe('allowlist', () => {
    it.each([
      ['none', 'none'],
      ['a missing row', null],
      ['a malformed row', 'everyone'],
      ['another company', '2222222222'],
    ])(
      'treats the company as switched off when the allowlist is %s',
      async (_label, value) => {
        configs.findOne.mockResolvedValue(value === null ? null : { value })

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'DISABLED',
        })

        expect(store.rows.size).toBe(0)
        expect(pdf).not.toHaveBeenCalled()
        expect(oneCalls()).toBe(0)
      },
    )

    it('delivers to a company the allowlist names, hyphen and all', async () => {
      configs.findOne.mockResolvedValue({
        value: `2222222222, ${COMPANY.nationalId.slice(0, 6)}-${COMPANY.nationalId.slice(6)}`,
      })

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'SENT',
      })
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
    })

    it('reads the active row on its own connection', async () => {
      await service.mailboxAllowlist()

      expect(configs.findOne).toHaveBeenCalledWith({
        where: { key: 'onesystems_mailbox_allowlist', supersededAt: null },
        attributes: ['value'],
        transaction: null,
      })
    })

    describe('isMailboxOpenFor', () => {
      it('is closed with the flag off, whatever the allowlist says', async () => {
        delete process.env.ONESYSTEMS_ENABLED

        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(false)
        expect(configs.findOne).not.toHaveBeenCalled()
      })

      it('is open to every company on `*` without reading the company', async () => {
        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(true)
        expect(companies.findOne).not.toHaveBeenCalled()
      })

      it('is closed on `none` without reading the company', async () => {
        configs.findOne.mockResolvedValue({ value: 'none' })

        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(false)
        expect(companies.findOne).not.toHaveBeenCalled()
      })

      it('is open only to a named company', async () => {
        configs.findOne.mockResolvedValue({ value: COMPANY.nationalId })
        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(true)

        configs.findOne.mockResolvedValue({ value: '2222222222' })
        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(false)
      })

      it('is closed to a company that does not exist', async () => {
        configs.findOne.mockResolvedValue({ value: COMPANY.nationalId })
        companies.findOne.mockResolvedValue(null)

        await expect(service.isMailboxOpenFor(COMPANY.id)).resolves.toBe(false)
      })
    })
  })

  describe('kill switch', () => {
    it.each([undefined, '', 'false', 'TRUE', '1'])(
      'does nothing when ONESYSTEMS_ENABLED is %p',
      async (value) => {
        if (value === undefined) {
          delete process.env.ONESYSTEMS_ENABLED
        } else {
          process.env.ONESYSTEMS_ENABLED = value
        }

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'DISABLED',
        })

        expect(companies.findOne).not.toHaveBeenCalled()
        expect(store.model.bulkCreate).not.toHaveBeenCalled()
        expect(store.model.update).not.toHaveBeenCalled()
        expect(store.rows.size).toBe(0)
        expect(pdf).not.toHaveBeenCalled()
        expect(oneCalls()).toBe(0)
      },
    )

    it('still refuses a malformed key while switched off', async () => {
      delete process.env.ONESYSTEMS_ENABLED

      await expect(
        service.deliverToMailbox(
          input({ idempotencyKey: `${PREFIX}salary-20270301` }),
        ),
      ).rejects.toThrow(InternalServerErrorException)

      expect(companies.findOne).not.toHaveBeenCalled()
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(store.rows.size).toBe(0)
      expect(oneCalls()).toBe(0)
    })

    it('returns DISABLED for a valid key while switched off, with no row', async () => {
      delete process.env.ONESYSTEMS_ENABLED

      await expect(
        service.deliverToMailbox(
          input({
            idempotencyKey: KEY,
            companyId: COMPANY.id.toUpperCase(),
          }),
        ),
      ).resolves.toEqual({ status: 'DISABLED' })

      expect(companies.findOne).not.toHaveBeenCalled()
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(store.rows.size).toBe(0)
      expect(oneCalls()).toBe(0)
    })
  })

  describe('quarantine', () => {
    it('delivers nothing to a quarantined company, and writes no row', async () => {
      companies.findOne.mockResolvedValue({ ...COMPANY, quarantined: true })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'QUARANTINED',
      })

      expect(companies.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: expect.arrayContaining(['quarantined']),
        }),
      )
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(store.rows.size).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
      expect(oneCalls()).toBe(0)
    })

    it('leaves a delivery already under way where it stopped', async () => {
      store.seed({
        status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
        oneCaseItemId: 'case-1',
        oneDocumentItemId: 'doc-1',
        attempts: 1,
      })
      companies.findOne.mockResolvedValue({ ...COMPANY, quarantined: true })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'QUARANTINED',
      })

      expect(onlyRow()).toEqual(
        expect.objectContaining({
          status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
          attempts: 1,
        }),
      )
      expect(oneCalls()).toBe(0)
    })
  })

  describe('findDelivery', () => {
    it('is null for a key with no row', async () => {
      await expect(service.findDelivery(KEY)).resolves.toBeNull()
    })

    it('says how far the delivery got, with the flag off too', async () => {
      delete process.env.ONESYSTEMS_ENABLED
      const row = store.seed({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: 'case-1',
        oneDocumentItemId: 'doc-1',
      })

      await expect(service.findDelivery(KEY)).resolves.toEqual({
        deliveryId: row.id,
        status: MailboxDeliveryStatusEnum.FAILED,
        documentFiled: true,
        sent: false,
        interrupted: false,
        inProgress: false,
        exhausted: false,
      })
      expect(store.model.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: null }),
      )
    })

    it.each([
      [
        'interrupted: a marker with its lease lapsed',
        {
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          leaseExpiresAt: new Date(Date.now() - MINUTE),
        },
        { interrupted: true, inProgress: false, exhausted: false },
      ],
      [
        'in progress: a live lease',
        {
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          leaseExpiresAt: new Date(Date.now() + 5 * MINUTE),
        },
        { interrupted: false, inProgress: true, exhausted: false },
      ],
      [
        'exhausted: out of attempts, no marker, no live lease',
        {
          status: MailboxDeliveryStatusEnum.FAILED,
          attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
        },
        { interrupted: false, inProgress: false, exhausted: true },
      ],
      [
        'none of them: a SENT row is settled, even under a live lease',
        {
          status: MailboxDeliveryStatusEnum.SENT,
          sentAt: new Date(Date.now() - MINUTE),
          inFlightStep: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
          leaseExpiresAt: new Date(Date.now() + 5 * MINUTE),
        },
        {
          sent: true,
          interrupted: false,
          inProgress: false,
          exhausted: false,
        },
      ],
      [
        'none of them: UNCERTAIN is settled, whatever its attempts',
        {
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
        },
        { interrupted: false, inProgress: false, exhausted: false },
      ],
    ])('says %s', async (_label, overrides, expected) => {
      store.seed(overrides)

      await expect(service.findDelivery(KEY)).resolves.toMatchObject(expected)
    })
  })

  describe('findStuckDeliveries', () => {
    it('lists UNCERTAIN, interrupted and exhausted rows, and nothing that can still move', async () => {
      const lapsed = new Date(Date.now() - MINUTE)
      const live = new Date(Date.now() + MINUTE)
      const uncertain = store.seed({
        idempotencyKey: keyFor('A'),
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
      })
      const interrupted = store.seed({
        idempotencyKey: keyFor('B'),
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
        inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        leaseToken: 'gone',
        leaseExpiresAt: lapsed,
      })
      const exhausted = store.seed({
        idempotencyKey: keyFor('C'),
        status: MailboxDeliveryStatusEnum.FAILED,
        attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
      })
      // Still moving: a live call, a row with attempts left, a last attempt
      // still holding its lease, and a sent row.
      store.seed({
        idempotencyKey: keyFor('D'),
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
        inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        leaseToken: 'live',
        leaseExpiresAt: live,
      })
      store.seed({
        idempotencyKey: keyFor('E'),
        status: MailboxDeliveryStatusEnum.FAILED,
        attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS - 1,
      })
      store.seed({
        idempotencyKey: keyFor('F'),
        status: MailboxDeliveryStatusEnum.FAILED,
        attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
        leaseToken: 'live',
        leaseExpiresAt: live,
      })
      store.seed({
        idempotencyKey: keyFor('G'),
        status: MailboxDeliveryStatusEnum.SENT,
        attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
        sentAt: lapsed,
      })

      const stuck = await service.findStuckDeliveries(50)

      expect(
        stuck.map(({ deliveryId, reason }) => ({ deliveryId, reason })),
      ).toEqual([
        { deliveryId: uncertain.id, reason: 'UNCERTAIN' },
        { deliveryId: interrupted.id, reason: 'INTERRUPTED' },
        { deliveryId: exhausted.id, reason: 'ATTEMPTS_EXHAUSTED' },
      ])
      expect(store.model.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          // Oldest attempt first: the fake ignores `order`, so it is pinned
          // here.
          order: [['lastAttemptAt', 'ASC']],
          transaction: null,
        }),
      )

      // Counted over every row, not the `limit` named.
      await expect(service.countStuckDeliveries()).resolves.toEqual({
        UNCERTAIN: 1,
        INTERRUPTED: 1,
        ATTEMPTS_EXHAUSTED: 1,
      })
      for (const [options] of store.model.count.mock.calls) {
        expect(options).toEqual(expect.objectContaining({ transaction: null }))
      }
    })

    /*
     * The filters are meant to be disjoint: the counts are summed into one
     * total. Rows that would match two if a filter lost a clause: an UNCERTAIN
     * row still carrying a lapsed marker, and an exhausted row with one.
     */
    it('counts a row that fits two descriptions once', async () => {
      const lapsed = new Date(Date.now() - MINUTE)
      store.seed({
        idempotencyKey: keyFor('A'),
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        inFlightStep: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
        leaseExpiresAt: lapsed,
      })
      store.seed({
        idempotencyKey: keyFor('B'),
        status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
        attempts: MAILBOX_DELIVERY_MAX_ATTEMPTS,
        inFlightStep: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
        leaseExpiresAt: lapsed,
      })

      const stuck = await service.findStuckDeliveries(50)
      const counts = await service.countStuckDeliveries()

      expect(stuck.map(({ reason }) => reason)).toEqual([
        'UNCERTAIN',
        'INTERRUPTED',
      ])
      expect(counts).toEqual({
        UNCERTAIN: 1,
        INTERRUPTED: 1,
        ATTEMPTS_EXHAUSTED: 0,
      })
      expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBe(
        stuck.length,
      )
    })

    it('counts past the limit it names', async () => {
      for (const discriminator of ['A', 'B', 'C']) {
        store.seed({
          idempotencyKey: keyFor(discriminator),
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
        })
      }

      await expect(service.findStuckDeliveries(2)).resolves.toHaveLength(2)
      await expect(service.countStuckDeliveries()).resolves.toEqual({
        UNCERTAIN: 3,
        INTERRUPTED: 0,
        ATTEMPTS_EXHAUSTED: 0,
      })
    })
  })

  describe('kind config', () => {
    it('answers UNCONFIGURED, at error, before any row or call for a real kind without a case template', async () => {
      service = build(MAILBOX_DELIVERY_KINDS)

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNCONFIGURED',
        kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
      })

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('has no case template'),
        expect.objectContaining({
          kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        }),
      )
      expect(companies.findOne).not.toHaveBeenCalled()
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(store.rows.size).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
      expect(oneCalls()).toBe(0)
    })

    /*
     * The dispatcher asks every minute, a batch of rows at a time. An error
     * line per answer would flood the alerting; the boot check and the daily
     * alert name the kind again.
     */
    it('logs an unconfigured kind at error once per kind, however often it is asked', async () => {
      service = build(MAILBOX_DELIVERY_KINDS)
      const fines = input({
        kind: MailboxDeliveryKindEnum.FINES_PRECURSOR,
        idempotencyKey: keyFor(
          'REPORT-1',
          MailboxDeliveryKindEnum.FINES_PRECURSOR,
        ),
      })

      for (let i = 0; i < 3; i += 1) {
        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'UNCONFIGURED',
          kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        })
        await expect(service.deliverToMailbox(fines)).resolves.toEqual({
          status: 'UNCONFIGURED',
          kind: MailboxDeliveryKindEnum.FINES_PRECURSOR,
        })
      }

      const unconfiguredLogs = logger.error.mock.calls.filter(([message]) =>
        String(message).includes('has no case template'),
      )
      expect(unconfiguredLogs.map(([, meta]) => meta.kind)).toEqual([
        MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        MailboxDeliveryKindEnum.FINES_PRECURSOR,
      ])
    })

    it.each([
      ['missing', undefined],
      ['blank', '  '],
    ])('refuses a %s caseType', (_label, caseType) => {
      expect(() =>
        resolveKindConfig(MailboxDeliveryKindEnum.FINES_PRECURSOR, {
          ...KINDS,
          [MailboxDeliveryKindEnum.FINES_PRECURSOR]: { ...CONFIG, caseType },
        }),
      ).toThrow(/FINES_PRECURSOR.*missing caseType/)
    })

    it('sends a missing classification field as an empty string', () => {
      expect(
        resolveKindConfig(MailboxDeliveryKindEnum.OVERDUE_NOTICE, {
          ...KINDS,
          [MailboxDeliveryKindEnum.OVERDUE_NOTICE]: { caseType: 'case-type' },
        }),
      ).toEqual({
        caseType: 'case-type',
        docCategory: '',
        docType: '',
        author: '',
        islandIsCategory: '',
        islandIsType: '',
      })
    })

    /*
     * ⚠️ Pins the confirmed case templates (Jafnréttisstofa, 30 Sep 2026). A
     * wrong one files real mail under the wrong case, which find-or-create
     * then reuses, so a change here must be on purpose.
     */
    it.each(
      MAILBOX_DELIVERY_KINDS_IN_USE.map((kind) => [
        kind,
        kind.startsWith('SALARY_') ? 'SKYRSLA' : 'J-AAETLUN',
      ]),
    )('%s is filed under case template %s', (kind, caseType) => {
      expect(isKindConfigured(kind)).toBe(true)
      expect(resolveKindConfig(kind).caseType).toBe(caseType)
    })

    it.each([
      MailboxDeliveryKindEnum.OVERDUE_NOTICE,
      MailboxDeliveryKindEnum.FINES_PRECURSOR,
    ])('%s, not in use, has no case template', (kind) => {
      expect(MAILBOX_DELIVERY_KINDS_IN_USE).not.toContain(kind)
      expect(isKindConfigured(kind)).toBe(false)
      expect(() => resolveKindConfig(kind)).toThrow(/missing caseType/)
    })

    it('has no kind in use without a case template', () => {
      expect(build(MAILBOX_DELIVERY_KINDS).unconfiguredKinds()).toEqual([])
      expect(
        build({
          ...KINDS,
          [MailboxDeliveryKindEnum.SALARY_REPORT_DENIED]: {},
        }).unconfiguredKinds(),
      ).toEqual([MailboxDeliveryKindEnum.SALARY_REPORT_DENIED])
    })

    it('returns a complete config', () => {
      expect(
        resolveKindConfig(MailboxDeliveryKindEnum.OVERDUE_NOTICE, KINDS),
      ).toEqual(CONFIG)
    })

    /*
     * A template unset after a delivery started (a deploy that rolls back
     * `mailbox-delivery.kinds.ts`). UNCONFIGURED lets the reminder task email
     * the notice, so it must not be the answer for a delivery One may already
     * hold or have sent: the existing row is read first and answers as it
     * stands, with no write, claim or call.
     */
    describe('a delivery that already reached One when its kind loses its template', () => {
      beforeEach(() => {
        service = build(MAILBOX_DELIVERY_KINDS)
      })

      const expectUntouched = (before: Row) => {
        expect(onlyRow()).toEqual(before)
        expect(store.model.update).not.toHaveBeenCalled()
        expect(store.model.bulkCreate).not.toHaveBeenCalled()
        expect(pdf).not.toHaveBeenCalled()
        expect(oneCalls()).toBe(0)
        expect(logger.error).not.toHaveBeenCalledWith(
          expect.stringContaining('has no case template'),
          expect.anything(),
        )
      }

      it('answers SENT for a sent one', async () => {
        const sentAt = new Date('2026-10-20T10:00:00.000Z')
        const row = store.seed({
          status: MailboxDeliveryStatusEnum.SENT,
          oneCaseItemId: 'case-1',
          oneDocumentItemId: 'doc-1',
          islandIsDocumentId: 'doc-1',
          sentAt,
        })
        const before = { ...row }

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'SENT',
          deliveryId: row.id,
          islandIsDocumentId: 'doc-1',
          sentAt,
          alreadySent: true,
        })
        expectUntouched(before)
      })

      it('answers UNCERTAIN for an uncertain one', async () => {
        const row = store.seed({
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          oneCaseItemId: 'case-1',
          oneDocumentItemId: 'doc-1',
        })
        const before = { ...row }

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'UNCERTAIN',
          deliveryId: row.id,
        })
        expectUntouched(before)
      })

      it('answers IN_PROGRESS while another worker holds its lease', async () => {
        const row = store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-1',
          inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          leaseToken: 'other-worker',
          leaseExpiresAt: new Date(Date.now() + 5 * MINUTE),
          attempts: 1,
        })
        const before = { ...row }

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'IN_PROGRESS',
          deliveryId: row.id,
        })
        expectUntouched(before)
      })

      it.each([
        [
          'a filed document',
          {
            status: MailboxDeliveryStatusEnum.FAILED,
            oneCaseItemId: 'case-1',
            oneDocumentItemId: 'doc-1',
            attempts: 2,
          },
        ],
        [
          'an interrupted call',
          {
            status: MailboxDeliveryStatusEnum.CASE_CREATED,
            oneCaseItemId: 'case-1',
            inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
            leaseToken: 'dead-worker',
            leaseExpiresAt: new Date(Date.now() - MINUTE),
            attempts: 2,
          },
        ],
      ])(
        'answers skipped UNCONFIGURED, not UNCONFIGURED, for one holding %s',
        async (_label, overrides) => {
          const row = store.seed(overrides)
          const before = { ...row }

          await expect(service.deliverToMailbox(input())).resolves.toEqual({
            status: overrides.status,
            deliveryId: row.id,
            attempts: 2,
            skipped: 'UNCONFIGURED',
          })
          expectUntouched(before)
          expect(logger.warn).toHaveBeenCalledWith(
            expect.stringContaining('already reached One'),
            expect.objectContaining({ deliveryId: row.id }),
          )
        },
      )

      // CreateCase is find-or-create and nothing is filed or sent, so the
      // notice may go another way.
      it('answers UNCONFIGURED for one that only has a case', async () => {
        const row = store.seed({
          status: MailboxDeliveryStatusEnum.FAILED,
          oneCaseItemId: 'case-1',
          attempts: 1,
        })
        const before = { ...row }

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'UNCONFIGURED',
          kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
        })
        expect(onlyRow()).toEqual(before)
        expect(oneCalls()).toBe(0)
      })
    })
  })

  describe('a fresh delivery', () => {
    it('makes the three calls in order and records every id', async () => {
      const result = await service.deliverToMailbox(
        input({ createDate: new Date('2026-09-24T12:00:00.000Z') }),
      )

      const row = onlyRow()
      expect(result).toEqual({
        status: 'SENT',
        deliveryId: row.id,
        islandIsDocumentId: 'island-1',
        sentAt: expect.any(Date),
        alreadySent: false,
      })

      expect(one.createCase).toHaveBeenCalledWith({
        nationalId: COMPANY.nationalId,
        customerName: COMPANY.name,
        caseType: CONFIG.caseType,
        portal: undefined,
      })
      expect(one.createDocument).toHaveBeenCalledWith({
        caseItemId: 'case-1',
        subject: 'Áminning',
        file: PDF,
        extension: 'PDF',
        createDate: new Date('2026-09-24T12:00:00.000Z'),
        author: CONFIG.author,
        docCategory: CONFIG.docCategory,
        docType: CONFIG.docType,
        portal: undefined,
      })
      expect(one.sendDocToIslandIs).toHaveBeenCalledWith({
        documentItemId: 'doc-1',
        nationalId: COMPANY.nationalId,
        category: CONFIG.islandIsCategory,
        type: CONFIG.islandIsType,
        sendNotification: undefined,
      })
      expect(oneCalls()).toBe(3)
      expect(pdf).toHaveBeenCalledTimes(1)

      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        oneCaseItemId: 'case-1',
        oneCaseNumber: 'JAF-2026-1',
        oneDocumentItemId: 'doc-1',
        islandIsDocumentId: 'island-1',
        sentAt: expect.any(Date),
        pdfSha256: PDF_SHA256,
        pdfSizeBytes: PDF.length,
        inFlightStep: null,
        attempts: 1,
        lastAttemptAt: expect.any(Date),
        leaseToken: null,
        leaseExpiresAt: null,
      })
    })

    it('marks each non-idempotent call before making it', async () => {
      const markers: Array<unknown> = []
      one.createDocument.mockImplementation(async () => {
        markers.push(onlyRow().inFlightStep)
        return { documentItemId: 'doc-1' }
      })
      one.sendDocToIslandIs.mockImplementation(async () => {
        markers.push(onlyRow().inFlightStep)
        return {
          islandIsDocumentId: 'island-1',
          alreadyInMailbox: false,
        }
      })

      await service.deliverToMailbox(input())

      expect(markers).toEqual([
        MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
      ])
    })

    it('inserts with ignoreDuplicates and reads the row back, never findOrCreate', async () => {
      await service.deliverToMailbox(input())

      expect(store.model.bulkCreate).toHaveBeenCalledWith(
        [
          {
            companyId: COMPANY.id,
            nationalId: COMPANY.nationalId,
            kind: MailboxDeliveryKindEnum.OVERDUE_NOTICE,
            idempotencyKey: KEY,
            subject: 'Áminning',
          },
        ],
        { ignoreDuplicates: true, transaction: null },
      )
      expect(store.model.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: KEY },
        transaction: null,
      })
      expect(store.model).not.toHaveProperty('findOrCreate')
    })
  })

  describe('resuming', () => {
    it('after CASE_CREATED makes only CreateDocument and the send', async () => {
      store.seed({
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
        oneCaseItemId: 'case-saved',
      })

      await service.deliverToMailbox(input())

      expect(one.createCase).not.toHaveBeenCalled()
      expect(one.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ caseItemId: 'case-saved' }),
      )
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
      expect(oneCalls()).toBe(2)
      expect(onlyRow().status).toBe(MailboxDeliveryStatusEnum.SENT)
    })

    it('after DOCUMENT_CREATED makes only the send and never renders', async () => {
      store.seed({
        status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
        oneCaseItemId: 'case-saved',
        oneDocumentItemId: 'doc-saved',
        pdfSha256: PDF_SHA256,
        pdfSizeBytes: PDF.length,
      })

      await service.deliverToMailbox(input())

      expect(pdf).not.toHaveBeenCalled()
      expect(one.createCase).not.toHaveBeenCalled()
      expect(one.createDocument).not.toHaveBeenCalled()
      expect(one.sendDocToIslandIs).toHaveBeenCalledWith(
        expect.objectContaining({ documentItemId: 'doc-saved' }),
      )
      expect(oneCalls()).toBe(1)
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        oneDocumentItemId: 'doc-saved',
        islandIsDocumentId: 'island-1',
      })
    })

    it('goes by the saved ids, not the status: a FAILED row with a document resumes at the send', async () => {
      store.seed({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: 'case-saved',
        oneDocumentItemId: 'doc-saved',
        attempts: 2,
      })

      await service.deliverToMailbox(input())

      expect(pdf).not.toHaveBeenCalled()
      expect(one.createDocument).not.toHaveBeenCalled()
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        attempts: 3,
      })
    })

    it('makes no call and takes no lease for a SENT row', async () => {
      const sentAt = new Date('2026-09-20T10:00:00.000Z')
      const seeded = store.seed({
        status: MailboxDeliveryStatusEnum.SENT,
        oneCaseItemId: 'case-saved',
        oneDocumentItemId: 'doc-saved',
        islandIsDocumentId: 'island-saved',
        sentAt,
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'SENT',
        deliveryId: seeded.id,
        islandIsDocumentId: 'island-saved',
        sentAt,
        alreadySent: true,
      })

      expect(oneCalls()).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
      expect(store.model.update).not.toHaveBeenCalled()
    })

    it('never retries an UNCERTAIN row', async () => {
      const seeded = store.seed({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneCaseItemId: 'case-saved',
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNCERTAIN',
        deliveryId: seeded.id,
      })

      expect(oneCalls()).toBe(0)
      expect(store.model.update).not.toHaveBeenCalled()
    })

    it('rejects a key reused for another company', async () => {
      store.seed({ companyId: OTHER_COMPANY_ID, nationalId: '2222222222' })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        ConflictException,
      )

      expect(store.model.update).not.toHaveBeenCalled()
      expect(oneCalls()).toBe(0)
    })

    it('rejects a key reused for another kind', async () => {
      store.seed({ kind: MailboxDeliveryKindEnum.FINES_PRECURSOR })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        ConflictException,
      )
      expect(oneCalls()).toBe(0)
    })

    describe('a repeat call with a different subject', () => {
      const SAVED_SUBJECT = 'Áminning um launagreiningu'
      const NEW_SUBJECT = 'Önnur áminning til Fyrirtæki ehf. vegna 2027'

      const allLogs = () =>
        JSON.stringify([
          ...logger.debug.mock.calls,
          ...logger.info.mock.calls,
          ...logger.warn.mock.calls,
          ...logger.error.mock.calls,
        ])

      it('warns with a flag only, and files the saved subject', async () => {
        const seeded = store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-saved',
          subject: SAVED_SUBJECT,
        })

        await expect(
          service.deliverToMailbox(input({ subject: NEW_SUBJECT })),
        ).resolves.toMatchObject({ status: 'SENT' })

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining(seeded.id),
          {
            context: 'MailboxDeliveryService',
            deliveryId: seeded.id,
            subjectMismatch: true,
          },
        )
        expect(one.createDocument).toHaveBeenCalledWith(
          expect.objectContaining({ subject: SAVED_SUBJECT }),
        )
        expect(onlyRow().subject).toBe(SAVED_SUBJECT)

        const logged = allLogs()
        expect(logged).toContain('subjectMismatch')
        expect(logged).not.toContain(NEW_SUBJECT)
        expect(logged).not.toContain(SAVED_SUBJECT)
      })

      it('warns for a settled row too, and still makes no call', async () => {
        const seeded = store.seed({
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          oneCaseItemId: 'case-saved',
          subject: SAVED_SUBJECT,
        })

        await expect(
          service.deliverToMailbox(input({ subject: NEW_SUBJECT })),
        ).resolves.toEqual({ status: 'UNCERTAIN', deliveryId: seeded.id })

        expect(oneCalls()).toBe(0)
        expect(logger.warn).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ subjectMismatch: true }),
        )
        expect(allLogs()).not.toContain(NEW_SUBJECT)
      })

      it('does not warn when the subject matches', async () => {
        store.seed({ subject: SAVED_SUBJECT })

        await service.deliverToMailbox(input({ subject: SAVED_SUBJECT }))

        expect(allLogs()).not.toContain('subjectMismatch')
      })

      it('still throws the conflict, not the warning, for another company', async () => {
        store.seed({
          companyId: OTHER_COMPANY_ID,
          nationalId: '2222222222',
          subject: SAVED_SUBJECT,
        })

        await expect(
          service.deliverToMailbox(input({ subject: NEW_SUBJECT })),
        ).rejects.toThrow(ConflictException)
        expect(allLogs()).not.toContain('subjectMismatch')
        expect(oneCalls()).toBe(0)
      })
    })

    it.each([
      ['a hand-built key', 'key-1'],
      [
        'a key for another kind',
        keyFor('SALARY-20270301', MailboxDeliveryKindEnum.FINES_PRECURSOR),
      ],
      [
        'a key for another company',
        keyFor(
          'SALARY-20270301',
          MailboxDeliveryKindEnum.OVERDUE_NOTICE,
          OTHER_COMPANY_ID,
        ),
      ],
      [
        'a key for an older format',
        `mailbox-delivery:v0:OVERDUE_NOTICE:${COMPANY.id}:SALARY-20270301`,
      ],
      [
        'a key with the upper-case company id',
        `mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY.id.toUpperCase()}:SALARY-20270301`,
      ],
      [
        'the prefix with no discriminator',
        `mailbox-delivery:v1:OVERDUE_NOTICE:${COMPANY.id}:`,
      ],
      // The builder upper-cases this, so the key it gives is a different
      // string: two spellings would be two deliveries.
      ['a lower-case discriminator', `${PREFIX}salary-20270301`],
      ['a trailing space', `${KEY} `],
      ['a colon in the discriminator', `${PREFIX}SALARY:20270301`],
      ['a non-ASCII discriminator', `${PREFIX}ÁRSSKÝRSLA-2027`],
      ['a discriminator over 64 characters', `${PREFIX}${'A'.repeat(65)}`],
    ])(
      'refuses %s before writing a row or calling One',
      async (_label, idempotencyKey) => {
        await expect(
          service.deliverToMailbox(input({ idempotencyKey })),
        ).rejects.toThrow(InternalServerErrorException)

        expect(store.model.bulkCreate).not.toHaveBeenCalled()
        expect(store.model.update).not.toHaveBeenCalled()
        expect(store.rows.size).toBe(0)
        expect(pdf).not.toHaveBeenCalled()
        expect(oneCalls()).toBe(0)
      },
    )

    it("accepts the builder's own key, however its parts were cased", async () => {
      const key = keyFor('salary-20270301', undefined, COMPANY.id.toUpperCase())
      expect(key).toBe(`${PREFIX}SALARY-20270301`)

      await expect(
        service.deliverToMailbox(input({ idempotencyKey: key })),
      ).resolves.toMatchObject({ status: 'SENT' })
      expect(onlyRow()).toMatchObject({ idempotencyKey: key })
    })

    it('looks the company up by its lowercased id and stores the id the DB returned', async () => {
      await service.deliverToMailbox(
        input({ companyId: COMPANY.id.toUpperCase() }),
      )

      expect(companies.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: COMPANY.id } }),
      )
      expect(onlyRow()).toMatchObject({
        companyId: COMPANY.id,
        status: MailboxDeliveryStatusEnum.SENT,
      })

      // A repeat with the id in either case resumes the same row.
      await expect(
        service.deliverToMailbox(input({ companyId: COMPANY.id })),
      ).resolves.toMatchObject({ status: 'SENT', alreadySent: true })
      expect(oneCalls()).toBe(3)
    })

    it('throws NotFound for an unknown company and writes no row', async () => {
      companies.findOne.mockResolvedValue(null)

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        NotFoundException,
      )
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(oneCalls()).toBe(0)
    })
  })

  describe('the lease', () => {
    it('skips a row another worker holds', async () => {
      const leaseExpiresAt = new Date(Date.now() + 3 * MINUTE)
      const seeded = store.seed({
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
        oneCaseItemId: 'case-saved',
        leaseToken: 'someone-else',
        leaseExpiresAt,
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'IN_PROGRESS',
        deliveryId: seeded.id,
      })

      expect(oneCalls()).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
      expect(onlyRow()).toMatchObject({
        leaseToken: 'someone-else',
        leaseExpiresAt,
        attempts: 0,
      })
    })

    it('takes over an expired lease', async () => {
      store.seed({
        leaseToken: 'crashed-worker',
        leaseExpiresAt: new Date(Date.now() - MINUTE),
      })

      const result = await service.deliverToMailbox(input())

      expect(result.status).toBe('SENT')
      expect(oneCalls()).toBe(3)
      expect(onlyRow().leaseToken).toBeNull()
    })

    it('claims with one conditional UPDATE ... RETURNING on a 7 minute lease', async () => {
      const seeded = store.seed()

      await service.deliverToMailbox(input())

      const [values, options] = store.model.update.mock.calls[0]
      expect(values).toMatchObject({
        leaseToken: expect.any(String),
        leaseExpiresAt: {
          val: "CURRENT_TIMESTAMP + INTERVAL '7 minutes'",
        },
        attempts: { val: 'attempts + 1' },
      })
      expect(options).toEqual({
        where: {
          id: seeded.id,
          status: {
            [Op.notIn]: [
              MailboxDeliveryStatusEnum.SENT,
              MailboxDeliveryStatusEnum.UNCERTAIN,
            ],
          },
          [Op.and]: [
            {
              [Op.or]: [
                { leaseExpiresAt: null },
                { leaseExpiresAt: { [Op.lt]: { val: 'CURRENT_TIMESTAMP' } } },
              ],
            },
            {
              [Op.or]: [
                { attempts: { [Op.lt]: MAILBOX_DELIVERY_MAX_ATTEMPTS } },
                { inFlightStep: { [Op.ne]: null } },
              ],
            },
          ],
        },
        returning: true,
        transaction: null,
      })
    })

    it('does not call One once another worker has taken the lease', async () => {
      one.createCase.mockImplementation(async () => {
        onlyRow().leaseToken = 'someone-else'
        return { caseItemId: 'case-1', caseNumber: null }
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        /Lost the lease/,
      )

      expect(one.createDocument).not.toHaveBeenCalled()
      // The case id is still saved: id writes do not need the lease.
      expect(onlyRow()).toMatchObject({
        oneCaseItemId: 'case-1',
        leaseToken: 'someone-else',
        inFlightStep: null,
      })
    })
  })

  describe('the attempts cap', () => {
    const CAP = MAILBOX_DELIVERY_MAX_ATTEMPTS
    const lastAttemptAt = new Date('2026-09-23T08:00:00.000Z')

    const seedFailed = (overrides: Partial<Row> = {}) =>
      store.seed({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: 'case-saved',
        lastAttemptAt,
        lastError: 'CreateDocument REJECTED: Rangt skjal',
        ...overrides,
      })

    const expectExhaustedLog = (deliveryId: string, attempts: number) => {
      expect(logger.error).toHaveBeenCalledTimes(1)
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(deliveryId),
        { context: 'MailboxDeliveryService', deliveryId, attempts },
      )
    }

    it('is five', () => {
      expect(CAP).toBe(5)
    })

    it('still claims and runs a FAILED row one attempt short of the cap', async () => {
      seedFailed({ attempts: CAP - 1 })

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'SENT',
        alreadySent: false,
      })

      expect(one.createDocument).toHaveBeenCalledTimes(1)
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        attempts: CAP,
      })
    })

    it.each([
      MailboxDeliveryStatusEnum.FAILED,
      MailboxDeliveryStatusEnum.PENDING,
      MailboxDeliveryStatusEnum.CASE_CREATED,
    ])(
      'does not claim a %s row at the cap, makes no call and reports it exhausted',
      async (status) => {
        const seeded = seedFailed({ status, attempts: CAP })

        const result = await service.deliverToMailbox(input())

        expect(result).toEqual({
          status,
          deliveryId: seeded.id,
          attempts: CAP,
          skipped: 'ATTEMPTS_EXHAUSTED',
        })
        expect(result.status).not.toBe('IN_PROGRESS')
        expect(oneCalls()).toBe(0)
        expect(pdf).not.toHaveBeenCalled()
        expect(onlyRow()).toMatchObject({
          status,
          attempts: CAP,
          lastAttemptAt,
          leaseToken: null,
          leaseExpiresAt: null,
        })
        expectExhaustedLog(seeded.id, CAP)
      },
    )

    it('reports a row past the cap as exhausted too', async () => {
      const seeded = seedFailed({ attempts: CAP + 2 })

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        skipped: 'ATTEMPTS_EXHAUSTED',
        attempts: CAP + 2,
      })
      expect(oneCalls()).toBe(0)
      expectExhaustedLog(seeded.id, CAP + 2)
    })

    it('stops a permanently rejected delivery after the cap', async () => {
      one.createCase.mockRejectedValue(rejected('CreateCase'))

      for (let attempt = 1; attempt <= CAP; attempt++) {
        await expect(service.deliverToMailbox(input())).rejects.toThrow(
          OneSystemsError,
        )
      }
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        attempts: CAP,
      })
      logger.error.mockClear()

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        skipped: 'ATTEMPTS_EXHAUSTED',
      })
      expect(one.createCase).toHaveBeenCalledTimes(CAP)
      expectExhaustedLog(onlyRow().id, CAP)
    })

    it('still reports a SENT row at the cap as already sent', async () => {
      const sentAt = new Date('2026-09-20T10:00:00.000Z')
      const seeded = store.seed({
        status: MailboxDeliveryStatusEnum.SENT,
        oneCaseItemId: 'case-saved',
        oneDocumentItemId: 'doc-saved',
        islandIsDocumentId: 'island-saved',
        sentAt,
        attempts: CAP,
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'SENT',
        deliveryId: seeded.id,
        islandIsDocumentId: 'island-saved',
        sentAt,
        alreadySent: true,
      })
      expect(oneCalls()).toBe(0)
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('still reports an UNCERTAIN row at the cap as UNCERTAIN', async () => {
      const seeded = seedFailed({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        attempts: CAP,
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNCERTAIN',
        deliveryId: seeded.id,
      })
      expect(oneCalls()).toBe(0)
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('still turns a marker left by the last attempt into UNCERTAIN, without calling One', async () => {
      const seeded = seedFailed({
        attempts: CAP,
        inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        leaseToken: 'crashed-worker',
        leaseExpiresAt: new Date(Date.now() - MINUTE),
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNCERTAIN',
        deliveryId: seeded.id,
      })
      expect(oneCalls()).toBe(0)
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        inFlightStep: null,
      })
    })

    it('reports IN_PROGRESS while the last attempt still holds its lease', async () => {
      const seeded = seedFailed({
        status: MailboxDeliveryStatusEnum.CASE_CREATED,
        attempts: CAP,
        leaseToken: 'someone-else',
        leaseExpiresAt: new Date(Date.now() + 3 * MINUTE),
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'IN_PROGRESS',
        deliveryId: seeded.id,
      })
      expect(oneCalls()).toBe(0)
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('runs a re-armed row once attempts is reset', async () => {
      const seeded = seedFailed({ attempts: CAP })
      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        skipped: 'ATTEMPTS_EXHAUSTED',
      })

      // The runbook's re-arm: UPDATE ... SET attempts = 0 WHERE status = 'FAILED'.
      Object.assign(store.rows.get(seeded.id) as Row, { attempts: 0 })

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'SENT',
        alreadySent: false,
      })
      expect(one.createCase).not.toHaveBeenCalled()
      expect(one.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ caseItemId: 'case-saved' }),
      )
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        attempts: 1,
      })
    })
  })

  describe('an interrupted call', () => {
    it.each([
      MailboxDeliveryStepEnum.CREATE_DOCUMENT,
      MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
    ])(
      'turns a stale %s marker into UNCERTAIN without calling One',
      async (step) => {
        const seeded = store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-saved',
          oneDocumentItemId:
            step === MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS
              ? 'doc-saved'
              : null,
          inFlightStep: step,
          leaseToken: 'crashed-worker',
          leaseExpiresAt: new Date(Date.now() - MINUTE),
        })

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'UNCERTAIN',
          deliveryId: seeded.id,
        })

        expect(oneCalls()).toBe(0)
        expect(pdf).not.toHaveBeenCalled()
        expect(onlyRow()).toMatchObject({
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          inFlightStep: null,
          lastError: expect.stringContaining(step),
          leaseToken: null,
          leaseExpiresAt: null,
        })
      },
    )
  })

  describe('failures', () => {
    it('records a CreateDocument that never reached the action as FAILED, and a retry creates it again', async () => {
      const error = new OneSystemsError('CreateDocument answered 400', {
        operation: 'CreateDocument',
        reason: 'HTTP',
        upstreamStatus: 400,
        isValidationProblemBody: true,
        errorNumber: '42',
        errorMessage: 'Rangt skjal',
      })
      one.createDocument.mockRejectedValueOnce(error)

      await expect(service.deliverToMailbox(input())).rejects.toBe(error)

      expect(one.sendDocToIslandIs).not.toHaveBeenCalled()
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: 'case-1',
        oneDocumentItemId: null,
        inFlightStep: null,
        lastError: 'CreateDocument HTTP 400: Rangt skjal',
        lastErrorNumber: '42',
        leaseToken: null,
        leaseExpiresAt: null,
      })

      const retry = await service.deliverToMailbox(input())

      expect(retry.status).toBe('SENT')
      expect(one.createCase).toHaveBeenCalledTimes(1)
      expect(one.createDocument).toHaveBeenCalledTimes(2)
      expect(onlyRow().attempts).toBe(2)
    })

    it('records a TRANSPORT CreateDocument as UNCERTAIN, and never repeats it', async () => {
      const error = transport('CreateDocument')
      one.createDocument.mockRejectedValueOnce(error)

      await expect(service.deliverToMailbox(input())).rejects.toBe(error)

      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneDocumentItemId: null,
        inFlightStep: null,
        pdfSha256: PDF_SHA256,
        pdfSizeBytes: PDF.length,
        leaseToken: null,
      })

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'UNCERTAIN',
      })
      expect(one.createDocument).toHaveBeenCalledTimes(1)
    })

    it('records a TRANSPORT send as UNCERTAIN and keeps the document id', async () => {
      const error = transport('SendDocToIslandIs')
      one.sendDocToIslandIs.mockRejectedValueOnce(error)

      await expect(service.deliverToMailbox(input())).rejects.toBe(error)

      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneDocumentItemId: 'doc-1',
        islandIsDocumentId: null,
        inFlightStep: null,
        leaseToken: null,
      })
    })

    it('records a 5xx send as UNCERTAIN', async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(
        new OneSystemsError('SendDocToIslandIs failed', {
          operation: 'SendDocToIslandIs',
          reason: 'HTTP',
          upstreamStatus: 503,
        }),
      )

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        OneSystemsError,
      )
      expect(onlyRow().status).toBe(MailboxDeliveryStatusEnum.UNCERTAIN)
    })

    it('records any CreateCase failure as FAILED, since CreateCase is safe to repeat', async () => {
      one.createCase.mockRejectedValueOnce(transport('CreateCase'))

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        OneSystemsError,
      )

      expect(pdf).not.toHaveBeenCalled()
      expect(one.createDocument).not.toHaveBeenCalled()
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: null,
        leaseToken: null,
      })
    })

    it('records a failed render as FAILED without marking or calling', async () => {
      pdf.mockRejectedValueOnce(new Error('puppeteer crashed'))

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        'puppeteer crashed',
      )

      expect(one.createDocument).not.toHaveBeenCalled()
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        inFlightStep: null,
        pdfSha256: null,
        lastError: 'puppeteer crashed',
        leaseToken: null,
      })
    })

    it('records UNCERTAIN when One created the document but the id could not be saved', async () => {
      const update = store.model.update.getMockImplementation()
      if (!update) {
        throw new Error('The store has no update implementation')
      }
      store.model.update.mockImplementation(async (values, options) => {
        if ('oneDocumentItemId' in values) {
          throw new Error('connection terminated')
        }
        return update(values, options)
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        'connection terminated',
      )

      expect(one.sendDocToIslandIs).not.toHaveBeenCalled()
      const row = onlyRow()
      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneDocumentItemId: null,
      })
      // The id exists only in the log now, which is what reconciles the row.
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('CreateDocument returned'),
        expect.objectContaining({
          deliveryId: row.id,
          documentItemId: 'doc-1',
        }),
      )
    })

    it('never overwrites a document id another worker saved first', async () => {
      one.createDocument.mockImplementation(async () => {
        Object.assign(onlyRow(), {
          oneDocumentItemId: 'doc-other',
          leaseToken: 'someone-else',
        })
        return { documentItemId: 'doc-1' }
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        InternalServerErrorException,
      )

      expect(onlyRow().oneDocumentItemId).toBe('doc-other')
      expect(one.sendDocToIslandIs).not.toHaveBeenCalled()
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('is a duplicate in One'),
        expect.objectContaining({
          duplicate: { oneDocumentItemId: 'doc-1' },
        }),
      )
    })
  })

  /** Runs `hook` around the store's own update, to inject a race or a lost reply. */
  const interceptUpdate = (
    hook: (
      values: Parameters<StoreUpdate>[0],
      apply: () => ReturnType<StoreUpdate>,
    ) => ReturnType<StoreUpdate>,
  ) => {
    const update = store.model.update.getMockImplementation()
    if (!update) {
      throw new Error('The store has no update implementation')
    }
    store.model.update.mockImplementation((values, options) =>
      hook(values, () => update(values, options)),
    )
  }

  describe('whether a failure is definitive depends on the operation', () => {
    const steps = [
      {
        operation: 'CreateDocument' as const,
        fail: (error: unknown) =>
          one.createDocument.mockRejectedValueOnce(error),
      },
      {
        operation: 'SendDocToIslandIs' as const,
        fail: (error: unknown) =>
          one.sendDocToIslandIs.mockRejectedValueOnce(error),
      },
    ]

    describe.each(steps)('$operation', ({ operation, fail }) => {
      it.each([
        [
          'Success: false (One may have acted first)',
          () => rejected(operation),
        ],
        ['a 400 that is not model validation', () => http(operation, 400)],
        // A 401/403/404 with a body may come from inside One's action.
        ['a 401 with a body', () => http(operation, 401)],
        ['a 403 with a body', () => http(operation, 403)],
        ['a 404 with a body', () => http(operation, 404)],
        // An empty body alone proves nothing: Unauthorized(null),
        // NotFound(null) and Forbid() from inside the action look like this.
        [
          'an empty-body 401 without a Bearer challenge',
          () => http(operation, 401, { hasEmptyBody: true }),
        ],
        [
          'an empty-body 403',
          () => http(operation, 403, { hasEmptyBody: true }),
        ],
        [
          'an empty-body 404',
          () => http(operation, 404, { hasEmptyBody: true }),
        ],
        ['a 409', () => http(operation, 409)],
        ['a 5xx', () => http(operation, 503)],
        ['no answer', () => transport(operation)],
        [
          'a 2xx without a usable body',
          () =>
            new OneSystemsError(`${operation} answered oddly`, {
              operation,
              reason: 'UNEXPECTED_RESPONSE',
            }),
        ],
        [
          'a 400 model-validation body labelled with another operation',
          () => http('CreateCase', 400, { isValidationProblemBody: true }),
        ],
        ['an error that is not a OneSystemsError', () => new Error('boom')],
      ])('records %s as UNCERTAIN', async (_why, makeError) => {
        fail(makeError())

        await expect(service.deliverToMailbox(input())).rejects.toThrow()

        expect(onlyRow()).toMatchObject({
          status: MailboxDeliveryStatusEnum.UNCERTAIN,
          inFlightStep: null,
          leaseToken: null,
        })
        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNCERTAIN',
        })
      })

      it.each([
        [
          'the JwtBearer challenge (an empty 401 with WWW-Authenticate: Bearer)',
          () =>
            http(operation, 401, {
              hasEmptyBody: true,
              hasBearerChallenge: true,
            }),
        ],
        [
          'a 400 model-validation body',
          () => http(operation, 400, { isValidationProblemBody: true }),
        ],
        [
          'input that cannot be sent',
          () =>
            new OneSystemsError(`${operation} input is invalid`, {
              operation,
              reason: 'INVALID_INPUT',
            }),
        ],
      ])(
        'records %s as FAILED, since One never acted',
        async (_why, makeError) => {
          fail(makeError())

          await expect(service.deliverToMailbox(input())).rejects.toThrow()

          expect(onlyRow()).toMatchObject({
            status: MailboxDeliveryStatusEnum.FAILED,
            inFlightStep: null,
            leaseToken: null,
          })
        },
      )
    })
  })

  describe('when One cannot be reached', () => {
    const loginRefused = () => http('Login', 401)

    // A failed Login is trusted for LOGIN_RETRY_AFTER_MS; move past it.
    let clock = 0
    const afterRetryWindow = () => {
      clock += LOGIN_RETRY_AFTER_MS + 1
    }
    beforeEach(() => {
      clock = 0
      const realNow = Date.now.bind(Date)
      jest.spyOn(Date, 'now').mockImplementation(() => realNow() + clock)
    })
    afterEach(() => {
      jest.restoreAllMocks()
    })

    const outageLogs = () =>
      logger.error.mock.calls.filter(([message]) =>
        String(message).startsWith('OneSystems is unavailable'),
      )

    it('answers UNAVAILABLE before writing or claiming anything', async () => {
      one.checkLogin.mockRejectedValueOnce(loginRefused())

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNAVAILABLE',
        reason: 'Login HTTP 401',
      })

      expect(store.rows.size).toBe(0)
      expect(oneCalls()).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
    })

    it('counts missing configuration as unavailable', async () => {
      one.checkLogin.mockRejectedValueOnce(
        new OneSystemsError('OneSystems is not configured', {
          operation: 'Login',
          reason: 'CONFIG',
        }),
      )

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'UNAVAILABLE',
        reason: 'Login CONFIG',
      })
    })

    it('trusts a failed Login for a while instead of sending a Login per delivery', async () => {
      one.checkLogin.mockRejectedValue(loginRefused())

      for (let i = 0; i < 5; i++) {
        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNAVAILABLE',
          reason: 'Login HTTP 401',
        })
      }
      expect(one.checkLogin).toHaveBeenCalledTimes(1)

      afterRetryWindow()
      await service.deliverToMailbox(input())

      expect(one.checkLogin).toHaveBeenCalledTimes(2)
    })

    it('never spends an attempt, however long Login fails, and delivers once it works', async () => {
      one.checkLogin.mockRejectedValue(loginRefused())

      for (let i = 0; i < MAILBOX_DELIVERY_MAX_ATTEMPTS + 2; i++) {
        afterRetryWindow()
        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNAVAILABLE',
        })
      }

      one.checkLogin.mockResolvedValue(undefined)
      afterRetryWindow()

      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'SENT',
      })
      expect(onlyRow().attempts).toBe(1)
    })

    it('logs the outage at error once, again when its reason changes, and its end once', async () => {
      one.checkLogin.mockRejectedValue(loginRefused())

      await service.deliverToMailbox(input())
      afterRetryWindow()
      await service.deliverToMailbox(input())
      expect(outageLogs()).toHaveLength(1)

      one.checkLogin.mockRejectedValue(transport('Login'))
      afterRetryWindow()
      await service.deliverToMailbox(input())
      expect(outageLogs()).toHaveLength(2)

      one.checkLogin.mockResolvedValue(undefined)
      afterRetryWindow()
      await service.deliverToMailbox(input())
      await service.deliverToMailbox(input())

      expect(
        logger.info.mock.calls.filter(
          ([message]) => message === 'OneSystems Login works again',
        ),
      ).toHaveLength(1)
    })

    describe('a delivery with this key that already got somewhere', () => {
      beforeEach(() => {
        one.checkLogin.mockRejectedValue(loginRefused())
      })

      it('answers SENT for a sent one', async () => {
        const seeded = store.seed({
          status: MailboxDeliveryStatusEnum.SENT,
          oneCaseItemId: 'case-1',
          oneDocumentItemId: 'doc-1',
          sentAt: new Date(),
        })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'SENT',
          deliveryId: seeded.id,
        })
      })

      it('answers UNCERTAIN for an uncertain one', async () => {
        store.seed({ status: MailboxDeliveryStatusEnum.UNCERTAIN })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNCERTAIN',
        })
      })

      it('answers IN_PROGRESS under a live lease', async () => {
        store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          leaseToken: 'other',
          leaseExpiresAt: new Date(Date.now() + 60_000),
        })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'IN_PROGRESS',
        })
      })

      it.each([
        [
          'a filed document',
          {
            status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
            oneCaseItemId: 'case-1',
            oneDocumentItemId: 'doc-1',
          },
        ],
        [
          'a marker',
          {
            status: MailboxDeliveryStatusEnum.CASE_CREATED,
            oneCaseItemId: 'case-1',
            inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
          },
        ],
      ])(
        'answers skipped UNAVAILABLE, not UNAVAILABLE, for one with %s',
        async (_what, overrides) => {
          const seeded = store.seed(overrides)

          await expect(service.deliverToMailbox(input())).resolves.toEqual({
            status: overrides.status,
            deliveryId: seeded.id,
            attempts: 0,
            skipped: 'UNAVAILABLE',
          })
          expect(onlyRow()).toMatchObject(overrides)
        },
      )

      it('answers UNAVAILABLE for one that got no further than CreateCase', async () => {
        store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-1',
        })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNAVAILABLE',
        })
      })
    })

    it.each([
      ['before CreateCase', 'createCase', MailboxDeliveryStatusEnum.PENDING],
      [
        'in front of CreateDocument, after its marker',
        'createDocument',
        MailboxDeliveryStatusEnum.CASE_CREATED,
      ],
      [
        'in front of SendDocToIslandIs, after its marker',
        'sendDocToIslandIs',
        MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
      ],
    ] as const)(
      'hands the attempt back when Login fails mid-run %s',
      async (_when, call, status) => {
        one[call].mockRejectedValueOnce(transport('Login'))

        await expect(service.deliverToMailbox(input())).resolves.toEqual({
          status: 'UNAVAILABLE',
          reason: 'Login TRANSPORT',
        })

        expect(onlyRow()).toMatchObject({
          status,
          attempts: 0,
          inFlightStep: null,
          leaseToken: null,
          leaseExpiresAt: null,
          lastError: 'Login TRANSPORT: Login did not answer',
        })

        afterRetryWindow()
        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'SENT',
        })
        expect(onlyRow().attempts).toBe(1)
      },
    )

    it('hands the attempt back when the action finds its configuration missing', async () => {
      one.createCase.mockRejectedValueOnce(
        new OneSystemsError('OneSystems is not configured', {
          operation: 'CreateCase',
          reason: 'CONFIG',
        }),
      )

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNAVAILABLE',
        reason: 'CreateCase CONFIG',
      })
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.PENDING,
        attempts: 0,
      })
    })

    it('rethrows anything that is not a OneSystems failure', async () => {
      const bug = new Error('boom')
      one.checkLogin.mockRejectedValueOnce(bug)

      await expect(service.deliverToMailbox(input())).rejects.toBe(bug)
    })

    describe('checkConnection', () => {
      it('logs in fresh and reports success', async () => {
        await expect(service.checkConnection()).resolves.toEqual({
          ok: true,
          reason: null,
        })
        expect(one.checkLogin).toHaveBeenCalledWith({ fresh: true })
        expect(oneCalls()).toBe(0)
      })

      it('reports the failure and starts the backoff, as a delivery would', async () => {
        one.checkLogin.mockRejectedValueOnce(loginRefused())

        await expect(service.checkConnection()).resolves.toEqual({
          ok: false,
          reason: 'Login HTTP 401',
        })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'UNAVAILABLE',
        })
        expect(one.checkLogin).toHaveBeenCalledTimes(1)
      })

      it('ends the backoff when it succeeds', async () => {
        one.checkLogin.mockRejectedValueOnce(loginRefused())
        await service.deliverToMailbox(input())

        await service.checkConnection()

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
          status: 'SENT',
        })
      })

      it('runs with ONESYSTEMS_ENABLED off', async () => {
        process.env.ONESYSTEMS_ENABLED = 'false'

        await expect(service.checkConnection()).resolves.toMatchObject({
          ok: true,
        })
      })
    })
  })

  describe('a send island.is already had', () => {
    it('is SENT, with a warning', async () => {
      one.sendDocToIslandIs.mockResolvedValueOnce({
        islandIsDocumentId: 'island-1',
        alreadyInMailbox: true,
      })

      const result = await service.deliverToMailbox(input())

      const row = onlyRow()
      expect(result).toMatchObject({
        status: 'SENT',
        islandIsDocumentId: 'island-1',
        alreadySent: false,
      })
      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        islandIsDocumentId: 'island-1',
        sentAt: expect.any(Date),
      })
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('island.is already had the document'),
        expect.objectContaining({ deliveryId: row.id }),
      )
    })
  })

  describe('a send confirmed without an ItemID', () => {
    it('is SENT, with a null island.is id', async () => {
      one.sendDocToIslandIs.mockResolvedValueOnce({
        islandIsDocumentId: null,
        alreadyInMailbox: false,
      })

      const result = await service.deliverToMailbox(input())

      const row = onlyRow()
      expect(result).toEqual({
        status: 'SENT',
        deliveryId: row.id,
        islandIsDocumentId: null,
        sentAt: expect.any(Date),
        alreadySent: false,
      })
      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        islandIsDocumentId: null,
        sentAt: expect.any(Date),
        inFlightStep: null,
        leaseToken: null,
      })
    })

    it('is reported as sent from sent_at alone, and never sent again', async () => {
      const sentAt = new Date('2026-09-20T10:00:00.000Z')
      const seeded = store.seed({
        status: MailboxDeliveryStatusEnum.SENT,
        oneCaseItemId: 'case-saved',
        oneDocumentItemId: 'doc-saved',
        islandIsDocumentId: null,
        sentAt,
      })

      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'SENT',
        deliveryId: seeded.id,
        islandIsDocumentId: null,
        sentAt,
        alreadySent: true,
      })
      expect(oneCalls()).toBe(0)
      expect(store.model.update).not.toHaveBeenCalled()
    })

    it('stays SENT when the save committed but its reply was lost', async () => {
      one.sendDocToIslandIs.mockResolvedValueOnce({
        islandIsDocumentId: null,
        alreadyInMailbox: false,
      })
      interceptUpdate(async (values, apply) => {
        if (values.status === MailboxDeliveryStatusEnum.SENT) {
          await apply()
          throw new Error('connection terminated')
        }
        return apply()
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        'connection terminated',
      )

      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        islandIsDocumentId: null,
        sentAt: expect.any(Date),
        inFlightStep: null,
        lastError: null,
        leaseToken: null,
        leaseExpiresAt: null,
      })
      await expect(service.deliverToMailbox(input())).resolves.toMatchObject({
        status: 'SENT',
        alreadySent: true,
      })
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
    })

    it('lets exactly one of two late saves win, and logs the other as a duplicate', async () => {
      const winnerSentAt = new Date('2026-09-24T09:00:00.000Z')
      one.sendDocToIslandIs.mockImplementation(async () => {
        // The other worker's save lands while this call is out.
        Object.assign(onlyRow(), {
          status: MailboxDeliveryStatusEnum.SENT,
          sentAt: winnerSentAt,
          islandIsDocumentId: null,
          inFlightStep: null,
        })
        return { islandIsDocumentId: null, alreadyInMailbox: false }
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        InternalServerErrorException,
      )

      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.SENT,
        sentAt: winnerSentAt,
        islandIsDocumentId: null,
      })
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('is a duplicate in One'),
        expect.objectContaining({
          step: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
          duplicate: { islandIsDocumentId: null, sentAt: expect.any(Date) },
        }),
      )
    })
  })

  describe('late results never undo a settled row', () => {
    const markUncertainByAnotherWorker = () =>
      Object.assign(onlyRow(), {
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        inFlightStep: null,
        leaseToken: null,
        leaseExpiresAt: null,
      })

    it('saves a late document id into an UNCERTAIN row but keeps it UNCERTAIN', async () => {
      one.createDocument.mockImplementation(async () => {
        markUncertainByAnotherWorker()
        return { documentItemId: 'doc-1' }
      })

      const result = await service.deliverToMailbox(input())

      const row = onlyRow()
      expect(result).toEqual({ status: 'UNCERTAIN', deliveryId: row.id })
      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneDocumentItemId: 'doc-1',
        inFlightStep: null,
      })
      expect(one.sendDocToIslandIs).not.toHaveBeenCalled()
    })

    it('saves a late send into an UNCERTAIN row but keeps it UNCERTAIN', async () => {
      one.sendDocToIslandIs.mockImplementation(async () => {
        markUncertainByAnotherWorker()
        return {
          islandIsDocumentId: 'island-1',
          alreadyInMailbox: false,
        }
      })

      const result = await service.deliverToMailbox(input())

      const row = onlyRow()
      expect(result).toEqual({ status: 'UNCERTAIN', deliveryId: row.id })
      expect(row).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        islandIsDocumentId: 'island-1',
        sentAt: expect.any(Date),
      })
      // UNCERTAIN wins over a saved sent_at: a person decides.
      await expect(service.deliverToMailbox(input())).resolves.toEqual({
        status: 'UNCERTAIN',
        deliveryId: row.id,
      })
      expect(one.sendDocToIslandIs).toHaveBeenCalledTimes(1)
    })

    it('keeps DOCUMENT_CREATED when the document save committed but its reply was lost', async () => {
      interceptUpdate(async (values, apply) => {
        if ('oneDocumentItemId' in values) {
          await apply()
          throw new Error('connection terminated')
        }
        return apply()
      })

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        'connection terminated',
      )

      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
        oneDocumentItemId: 'doc-1',
        inFlightStep: null,
        leaseToken: null,
      })
    })

    it.each([
      {
        step: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        lateSave: {
          status: MailboxDeliveryStatusEnum.DOCUMENT_CREATED,
          oneDocumentItemId: 'doc-late',
        },
        expected: { status: 'IN_PROGRESS' },
      },
      {
        step: MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS,
        lateSave: {
          status: MailboxDeliveryStatusEnum.SENT,
          sentAt: new Date('2026-09-24T09:00:00.000Z'),
          islandIsDocumentId: null,
        },
        expected: {
          status: 'SENT',
          alreadySent: true,
          islandIsDocumentId: null,
        },
      },
    ])(
      'does not mark UNCERTAIN when a late $step save clears the marker first',
      async ({ step, lateSave, expected }) => {
        store.seed({
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-saved',
          oneDocumentItemId:
            step === MailboxDeliveryStepEnum.SEND_DOC_TO_ISLAND_IS
              ? 'doc-saved'
              : null,
          inFlightStep: step,
          leaseToken: 'slow-worker',
          leaseExpiresAt: new Date(Date.now() - MINUTE),
        })
        interceptUpdate(async (values, apply) => {
          const result = await apply()
          if ('attempts' in values) {
            // The slow worker's reply is saved right after our claim.
            Object.assign(onlyRow(), { ...lateSave, inFlightStep: null })
          }
          return result
        })

        await expect(service.deliverToMailbox(input())).resolves.toMatchObject(
          expected,
        )

        expect(oneCalls()).toBe(0)
        expect(onlyRow()).toMatchObject({
          ...lateSave,
          lastError: null,
          leaseToken: null,
          leaseExpiresAt: null,
        })
      },
    )
  })

  describe('the ids One returns', () => {
    it('logs each id before saving it', async () => {
      await service.deliverToMailbox(input())

      const row = onlyRow()
      const logged = (operation: string, ids: Record<string, unknown>) => {
        const index = logger.info.mock.calls.findIndex(
          ([message]) =>
            message === `Mailbox delivery ${row.id}: ${operation} returned`,
        )
        expect(index).toBeGreaterThanOrEqual(0)
        expect(logger.info.mock.calls[index][1]).toMatchObject({
          deliveryId: row.id,
          ...ids,
        })
        return logger.info.mock.invocationCallOrder[index]
      }
      const savedAt = (column: string) => {
        const index = store.model.update.mock.calls.findIndex(
          ([values]) => column in values,
        )
        return store.model.update.mock.invocationCallOrder[index]
      }

      expect(
        logged('CreateCase', {
          caseItemId: 'case-1',
          caseNumber: 'JAF-2026-1',
        }),
      ).toBeLessThan(savedAt('oneCaseItemId'))
      expect(
        logged('CreateDocument', { documentItemId: 'doc-1' }),
      ).toBeLessThan(savedAt('oneDocumentItemId'))
      expect(
        logged('SendDocToIslandIs', { islandIsDocumentId: 'island-1' }),
      ).toBeLessThan(savedAt('islandIsDocumentId'))
    })

    it('logs a case id that lost the race to be saved', async () => {
      one.createCase.mockImplementation(async () => {
        Object.assign(onlyRow(), {
          status: MailboxDeliveryStatusEnum.CASE_CREATED,
          oneCaseItemId: 'case-other',
        })
        return { caseItemId: 'case-1', caseNumber: null }
      })

      await service.deliverToMailbox(input())

      expect(one.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ caseItemId: 'case-other' }),
      )
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('case-1'),
        expect.objectContaining({
          savedCaseItemId: 'case-other',
          discardedCaseItemId: 'case-1',
        }),
      )
    })

    it("never logs the recipient's kennitala, name or One's error text", async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(
        new OneSystemsError('SendDocToIslandIs was rejected', {
          operation: 'SendDocToIslandIs',
          reason: 'REJECTED',
          errorNumber: '7',
          errorMessage: `Viðtakandi ${COMPANY.nationalId} ${COMPANY.name} fannst ekki`,
        }),
      )

      await expect(service.deliverToMailbox(input())).rejects.toThrow()

      const logged = JSON.stringify([
        ...logger.debug.mock.calls,
        ...logger.info.mock.calls,
        ...logger.warn.mock.calls,
        ...logger.error.mock.calls,
      ])
      expect(logged.length).toBeGreaterThan(100)
      expect(logged).toContain('errorNumber')
      expect(logged).not.toContain(COMPANY.nationalId)
      expect(logged).not.toContain(COMPANY.name)
      expect(logged).not.toContain('fannst ekki')
    })

    describe.each([
      ['bare', '0101302989'],
      ['hyphenated', '010130-2989'],
    ])('an ErrorNumber that is a %s kennitala', (_shape, kennitala) => {
      const loggerCalls = () =>
        JSON.stringify([
          ...logger.debug.mock.calls,
          ...logger.info.mock.calls,
          ...logger.warn.mock.calls,
          ...logger.error.mock.calls,
        ])

      it.each([
        ['CreateCase', () => one.createCase],
        ['CreateDocument', () => one.createDocument],
        ['SendDocToIslandIs', () => one.sendDocToIslandIs],
      ] as const)(
        'is never logged or stored when %s fails',
        async (operation, method) => {
          method().mockRejectedValueOnce(
            new OneSystemsError(`${operation} was rejected`, {
              operation,
              reason: 'REJECTED',
              errorNumber: kennitala,
            }),
          )

          await expect(service.deliverToMailbox(input())).rejects.toThrow(
            OneSystemsError,
          )

          expect(logger.error).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              reason: 'REJECTED',
              errorNumber: '[not a code, withheld]',
            }),
          )
          expect(loggerCalls()).not.toContain(kennitala)
          // Stored in its loggable form too, never raw.
          expect(onlyRow().lastErrorNumber).toBe('[not a code, withheld]')
        },
      )
    })

    it('logs a code-shaped ErrorNumber as it is', async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(rejected('SendDocToIslandIs'))

      await expect(service.deliverToMailbox(input())).rejects.toThrow()

      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ errorNumber: '42' }),
      )
    })

    it('cuts last_error to 500 characters', async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(
        new OneSystemsError('SendDocToIslandIs was rejected', {
          operation: 'SendDocToIslandIs',
          reason: 'REJECTED',
          errorMessage: 'x'.repeat(5_000),
        }),
      )

      await expect(service.deliverToMailbox(input())).rejects.toThrow()

      const lastError = onlyRow().lastError as string
      expect(lastError).toHaveLength(500)
      expect(lastError.startsWith('SendDocToIslandIs REJECTED: xxx')).toBe(true)
    })
  })

  describe('the lease length', () => {
    // Worked out here from the client's exported timeouts, independently of
    // the service's own derivation. A lazy Login and the send, then after a
    // 401 (which can arrive only as the first send's timeout runs out) a
    // second Login and the retried send, each with its own full timeout.
    const loginMs = oneSystemsTimeoutMs('Login')
    const sendMs = oneSystemsTimeoutMs('SendDocToIslandIs')
    const worstCaseMs = loginMs + sendMs + loginMs + sendMs

    it('reads the timeouts the client really uses', () => {
      expect(loginMs).toBe(ONESYSTEMS_REQUEST_TIMEOUT_MS)
      expect(sendMs).toBe(ONESYSTEMS_DOCUMENT_TIMEOUT_MS)
      // CreateDocument carries the PDF and gets the same long timeout.
      expect(oneSystemsTimeoutMs('CreateDocument')).toBe(
        ONESYSTEMS_DOCUMENT_TIMEOUT_MS,
      )
      expect(sendMs).toBeGreaterThanOrEqual(
        Math.max(
          oneSystemsTimeoutMs('CreateCase'),
          oneSystemsTimeoutMs('CreateDocument'),
        ),
      )
      expect(MAILBOX_DELIVERY_SLOWEST_CALL_MS).toBe(worstCaseMs)
    })

    it('outlasts the slowest call to One, slow 401 included, with room for a render', () => {
      expect(MAILBOX_DELIVERY_LEASE_MINUTES * MINUTE).toBeGreaterThan(
        worstCaseMs,
      )
      expect(MAILBOX_DELIVERY_LEASE_MINUTES * MINUTE).toBeGreaterThanOrEqual(
        worstCaseMs + 2 * MINUTE,
      )
      expect(Number.isInteger(MAILBOX_DELIVERY_LEASE_MINUTES)).toBe(true)
    })
  })

  describe('transactions', () => {
    const expectAllOutsideTransaction = () => {
      const options = [
        ...companies.findOne.mock.calls.map(([o]) => o),
        ...store.model.findOne.mock.calls.map(([o]) => o),
        ...store.model.bulkCreate.mock.calls.map(([, o]) => o),
        ...store.model.update.mock.calls.map(([, o]) => o),
      ]
      expect(options.length).toBeGreaterThan(0)
      for (const option of options) {
        expect(option).toHaveProperty('transaction', null)
      }
    }

    it('passes transaction: null to every query on the happy path', async () => {
      await service.deliverToMailbox(input())

      expect(store.model.update.mock.calls.length).toBeGreaterThanOrEqual(6)
      expectAllOutsideTransaction()
    })

    it('passes transaction: null on the failure and skip paths', async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(
        transport('SendDocToIslandIs'),
      )
      await expect(service.deliverToMailbox(input())).rejects.toThrow()

      store.seed({
        idempotencyKey: keyFor('SALARY-20280301'),
        leaseToken: 'someone-else',
        leaseExpiresAt: new Date(Date.now() + MINUTE),
      })
      await service.deliverToMailbox(
        input({ idempotencyKey: keyFor('SALARY-20280301') }),
      )

      store.seed({
        idempotencyKey: keyFor('SALARY-20290301'),
        inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        oneCaseItemId: 'case-saved',
      })
      await service.deliverToMailbox(
        input({ idempotencyKey: keyFor('SALARY-20290301') }),
      )

      expectAllOutsideTransaction()
    })
  })
})
