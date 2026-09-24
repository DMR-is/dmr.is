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
  MAILBOX_DELIVERY_KINDS,
  type MailboxDeliveryKindConfigs,
  resolveKindConfig,
} from './mailbox-delivery.kinds'
import {
  MAILBOX_DELIVERY_LEASE_MINUTES,
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

const KINDS: MailboxDeliveryKindConfigs = {
  [MailboxDeliveryKindEnum.OVERDUE_NOTICE]: CONFIG,
  [MailboxDeliveryKindEnum.FINES_PRECURSOR]: CONFIG,
}

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

/** Stands in for the three SQL fragments the service sends as literals. */
function evaluate(value: unknown, row: Row): unknown {
  if (!isLiteral(value)) {
    return value
  }
  if (value.val === 'attempts + 1') {
    return (row.attempts as number) + 1
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
        return actual !== ops[Op.ne]
      }
      if (Op.lt in ops) {
        const bound = evaluate(ops[Op.lt], row) as Date
        return actual instanceof Date && actual.getTime() < bound.getTime()
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
  let one: jest.Mocked<IOneSystemsService>
  let pdf: jest.Mock<Promise<Buffer>, []>
  let service: MailboxDeliveryService

  const build = (kinds: MailboxDeliveryKindConfigs = KINDS) =>
    new MailboxDeliveryService(
      logger as never,
      store.model as never,
      companies as never,
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
    one = {
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
    one.sendDocToIslandIs.mockResolvedValue({ islandIsDocumentId: 'island-1' })
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

  describe('kind config', () => {
    it('throws before any row or call while the real kinds are placeholders', async () => {
      service = build(MAILBOX_DELIVERY_KINDS)

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        InternalServerErrorException,
      )

      expect(companies.findOne).not.toHaveBeenCalled()
      expect(store.model.bulkCreate).not.toHaveBeenCalled()
      expect(store.rows.size).toBe(0)
      expect(pdf).not.toHaveBeenCalled()
      expect(oneCalls()).toBe(0)
    })

    it('names every missing field, and treats blank as missing', () => {
      expect(() =>
        resolveKindConfig(MailboxDeliveryKindEnum.FINES_PRECURSOR, {
          ...KINDS,
          [MailboxDeliveryKindEnum.FINES_PRECURSOR]: {
            ...CONFIG,
            docType: '  ',
            islandIsType: undefined,
          },
        }),
      ).toThrow(/FINES_PRECURSOR.*missing docType, islandIsType/)
    })

    it('returns a complete config', () => {
      expect(
        resolveKindConfig(MailboxDeliveryKindEnum.OVERDUE_NOTICE, KINDS),
      ).toEqual(CONFIG)
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
        return { islandIsDocumentId: 'island-1' }
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
          [Op.or]: [
            { leaseExpiresAt: null },
            { leaseExpiresAt: { [Op.lt]: { val: 'CURRENT_TIMESTAMP' } } },
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
        ['a failed Login in front of it', () => transport('Login')],
        [
          'missing configuration',
          () =>
            new OneSystemsError('OneSystems is not configured', {
              operation: 'Login',
              reason: 'CONFIG',
            }),
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

  describe('a send confirmed without an ItemID', () => {
    it('is SENT, with a null island.is id', async () => {
      one.sendDocToIslandIs.mockResolvedValueOnce({ islandIsDocumentId: null })

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
      one.sendDocToIslandIs.mockResolvedValueOnce({ islandIsDocumentId: null })
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
        return { islandIsDocumentId: null }
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
        return { islandIsDocumentId: 'island-1' }
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
