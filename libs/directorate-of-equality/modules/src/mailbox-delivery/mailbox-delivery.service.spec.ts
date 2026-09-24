import { createHash } from 'crypto'
import { Op } from 'sequelize'

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import { OneSystemsError } from '@dmr.is/clients-onesystems'

import {
  MailboxDeliveryKindEnum,
  MailboxDeliveryStatusEnum,
  MailboxDeliveryStepEnum,
} from './models/mailbox-delivery.enums'
import {
  MAILBOX_DELIVERY_KINDS,
  type MailboxDeliveryKindConfigs,
  resolveKindConfig,
} from './mailbox-delivery.kinds'
import { MailboxDeliveryService } from './mailbox-delivery.service'
import { DeliverToMailboxInput } from './mailbox-delivery.service.interface'

/** Placeholder kennitala: shape only, never checksum-valid. */
const COMPANY = {
  id: 'company-1',
  name: 'Fyrirtæki ehf.',
  nationalId: '1111111111',
}

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
    expect(value.val).toBe("CURRENT_TIMESTAMP + INTERVAL '5 minutes'")
    return new Date(Date.now() + 5 * MINUTE)
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
      idempotencyKey: 'key-1',
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

const rejected = (
  operation: 'CreateCase' | 'CreateDocument' | 'SendDocToIslandIs',
) =>
  new OneSystemsError(`${operation} was rejected`, {
    operation,
    reason: 'REJECTED',
    errorNumber: '42',
    errorMessage: 'Rangt skjal',
  })

const transport = (
  operation: 'CreateCase' | 'CreateDocument' | 'SendDocToIslandIs',
) =>
  new OneSystemsError(`${operation} did not answer`, {
    operation,
    reason: 'TRANSPORT',
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
  let one: {
    createCase: jest.Mock
    createDocument: jest.Mock
    sendDocToIslandIs: jest.Mock
    closeCase: jest.Mock
  }
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
    idempotencyKey: 'key-1',
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
      createCase: jest
        .fn()
        .mockResolvedValue({ caseItemId: 'case-1', caseNumber: 'JAF-2026-1' }),
      createDocument: jest.fn().mockResolvedValue({ documentItemId: 'doc-1' }),
      sendDocToIslandIs: jest
        .fn()
        .mockResolvedValue({ islandIsDocumentId: 'island-1' }),
      closeCase: jest.fn(),
    }
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
            idempotencyKey: 'key-1',
            subject: 'Áminning',
          },
        ],
        { ignoreDuplicates: true, transaction: null },
      )
      expect(store.model.findOne).toHaveBeenCalledWith({
        where: { idempotencyKey: 'key-1' },
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
      store.seed({ companyId: 'company-2', nationalId: '2222222222' })

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

    it('claims with one conditional UPDATE ... RETURNING on a 5 minute lease', async () => {
      const seeded = store.seed()

      await service.deliverToMailbox(input())

      const [values, options] = store.model.update.mock.calls[0]
      expect(values).toMatchObject({
        leaseToken: expect.any(String),
        leaseExpiresAt: {
          val: "CURRENT_TIMESTAMP + INTERVAL '5 minutes'",
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
    it('records a REJECTED CreateDocument as FAILED, and a retry creates it again', async () => {
      const error = rejected('CreateDocument')
      one.createDocument.mockRejectedValueOnce(error)

      await expect(service.deliverToMailbox(input())).rejects.toBe(error)

      expect(one.sendDocToIslandIs).not.toHaveBeenCalled()
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.FAILED,
        oneCaseItemId: 'case-1',
        oneDocumentItemId: null,
        inFlightStep: null,
        lastError: 'CreateDocument REJECTED: Rangt skjal',
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

    it('records a 4xx send as FAILED', async () => {
      one.sendDocToIslandIs.mockRejectedValueOnce(
        new OneSystemsError('SendDocToIslandIs refused', {
          operation: 'SendDocToIslandIs',
          reason: 'HTTP',
          upstreamStatus: 400,
        }),
      )

      await expect(service.deliverToMailbox(input())).rejects.toThrow(
        OneSystemsError,
      )
      expect(onlyRow().status).toBe(MailboxDeliveryStatusEnum.FAILED)
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
      expect(onlyRow()).toMatchObject({
        status: MailboxDeliveryStatusEnum.UNCERTAIN,
        oneDocumentItemId: null,
      })
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
        expect.stringContaining('doc-1 is a duplicate'),
        expect.objectContaining({ duplicateId: 'doc-1' }),
      )
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
        idempotencyKey: 'key-2',
        leaseToken: 'someone-else',
        leaseExpiresAt: new Date(Date.now() + MINUTE),
      })
      await service.deliverToMailbox(input({ idempotencyKey: 'key-2' }))

      store.seed({
        idempotencyKey: 'key-3',
        inFlightStep: MailboxDeliveryStepEnum.CREATE_DOCUMENT,
        oneCaseItemId: 'case-saved',
      })
      await service.deliverToMailbox(input({ idempotencyKey: 'key-3' }))

      expectAllOutsideTransaction()
    })
  })
})
