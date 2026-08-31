import { ServiceUnavailableException } from '@nestjs/common'
import { getConnectionToken, getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../company/models/company.enums'
import { CompanyModel } from '../company/models/company.model'
import { IsatCategoryModel } from '../company/models/isat-category.model'
import { ICompanyEventService } from '../company-event/company-event.service.interface'
import { PostcodeModel } from '../location/models/postcode.model'
import { PARSE_GATE } from '../parse-gate/parse-gate.token'
import { Semaphore } from '../parse-gate/semaphore'
import { CompanyImportOutcomeEnum } from './dto/company-import-result.dto'
import { ParsedCompanyRow } from './dto/parsed-company-row.dto'
import { CompanyImportService } from './company-import.service'

jest.mock('./parser/company-import.parser', () => ({
  parseCompanyImport: jest.fn(),
}))
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { parseCompanyImport } = require('./parser/company-import.parser')
const mockParse = parseCompanyImport as jest.Mock

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const BUF = Buffer.from('x')

const makeRow = (o: Partial<ParsedCompanyRow> = {}): ParsedCompanyRow => ({
  row: 2,
  nationalId: '4101660389',
  name: 'Acme ehf.',
  address: 'Vesturvör 34',
  postcodeCode: '200',
  isatCategoryCode: '49390',
  size: CompanySizeEnum.LARGE,
  ...o,
})

const makeCompany = (o: Partial<CompanyModel> = {}) =>
  ({
    id: 'c1',
    nationalId: '4101660389',
    name: 'Acme ehf.',
    address: 'Vesturvör 34',
    postcodeId: 'pc-200',
    postcode: { code: '200' },
    isatCategoryCode: '49390',
    employeeCountCategory: CompanySizeEnum.LARGE,
    status: CompanyStatusEnum.ACTIVE,
    update: jest.fn(),
    ...o,
  }) as unknown as CompanyModel

describe('CompanyImportService', () => {
  let service: CompanyImportService
  let companyFindAll: jest.Mock
  let companyCreate: jest.Mock
  let isatFindAll: jest.Mock
  let postcodeFindAll: jest.Mock
  let emitCreated: jest.Mock
  let emitStatusChanged: jest.Mock
  let transaction: jest.Mock

  beforeEach(async () => {
    jest.clearAllMocks()
    companyFindAll = jest.fn().mockResolvedValue([])
    companyCreate = jest.fn().mockResolvedValue(makeCompany({ id: 'new-1' }))
    isatFindAll = jest.fn().mockResolvedValue([{ code: '49390' }])
    postcodeFindAll = jest
      .fn()
      .mockResolvedValue([{ code: '200', id: 'pc-200' }])
    emitCreated = jest.fn()
    emitStatusChanged = jest.fn()
    transaction = jest.fn(async (cb: () => Promise<unknown>) => cb())

    mockParse.mockResolvedValue({ rows: [], errors: [], year: 2025 })

    const module = await Test.createTestingModule({
      providers: [
        CompanyImportService,
        { provide: LOGGER_PROVIDER, useValue: mockLogger },
        { provide: getConnectionToken(), useValue: { transaction } },
        {
          provide: getModelToken(CompanyModel),
          useValue: { findAll: companyFindAll, create: companyCreate },
        },
        {
          provide: getModelToken(IsatCategoryModel),
          useValue: { findAll: isatFindAll },
        },
        {
          provide: getModelToken(PostcodeModel),
          useValue: { findAll: postcodeFindAll },
        },
        {
          provide: ICompanyEventService,
          useValue: { emitCreated, emitStatusChanged },
        },
        // A real gate rather than a stub, sized so it never blocks: these
        // tests are about reconciliation, but the acquire/release path should
        // still be the real one so a leaked slot would surface here as a hang
        // rather than being mocked away.
        { provide: PARSE_GATE, useValue: new Semaphore(2, 20) },
      ],
    }).compile()

    service = module.get(CompanyImportService)
  })

  it('categorizes a company that is in the file but not in the DB as CREATED', async () => {
    mockParse.mockResolvedValue({ rows: [makeRow()], errors: [], year: 2025 })
    companyFindAll.mockResolvedValue([])

    const result = await service.preview(BUF)

    expect(result.committed).toBe(false)
    expect(result.created).toHaveLength(1)
    expect(result.created[0].outcome).toBe(CompanyImportOutcomeEnum.CREATED)
  })

  it('categorizes an identical company as UNCHANGED', async () => {
    mockParse.mockResolvedValue({ rows: [makeRow()], errors: [], year: 2025 })
    companyFindAll.mockResolvedValue([makeCompany()])

    const result = await service.preview(BUF)

    expect(result.unchanged).toHaveLength(1)
    expect(result.updated).toHaveLength(0)
  })

  it('records field-level changes as UPDATED', async () => {
    mockParse.mockResolvedValue({
      rows: [makeRow({ name: 'Acme New ehf.', size: CompanySizeEnum.MEDIUM })],
      errors: [],
      year: 2025,
    })
    companyFindAll.mockResolvedValue([makeCompany()])

    const result = await service.preview(BUF)

    expect(result.updated).toHaveLength(1)
    const fields = result.updated[0].changedFields.map((c) => c.field)
    expect(fields).toEqual(expect.arrayContaining(['name', 'size']))
  })

  it('flips an INACTIVE company back to ACTIVE as REACTIVATED', async () => {
    mockParse.mockResolvedValue({ rows: [makeRow()], errors: [], year: 2025 })
    companyFindAll.mockResolvedValue([
      makeCompany({ status: CompanyStatusEnum.INACTIVE }),
    ])

    const result = await service.preview(BUF)

    expect(result.reactivated).toHaveLength(1)
    expect(result.reactivated[0].changedFields[0]).toMatchObject({
      field: 'status',
      from: CompanyStatusEnum.INACTIVE,
      to: CompanyStatusEnum.ACTIVE,
    })
  })

  it('marks a DB company absent from the file as DEACTIVATED', async () => {
    mockParse.mockResolvedValue({ rows: [], errors: [], year: 2025 })
    companyFindAll.mockResolvedValue([
      makeCompany({ nationalId: '4101680229' }),
    ])

    const result = await service.preview(BUF)

    expect(result.deactivated).toHaveLength(1)
    expect(result.deactivated[0].outcome).toBe(
      CompanyImportOutcomeEnum.DEACTIVATED,
    )
    expect(result.deactivated[0].changedFields[0]).toMatchObject({
      field: 'status',
      from: CompanyStatusEnum.ACTIVE,
      to: CompanyStatusEnum.INACTIVE,
    })
  })

  it('leaves an already-INACTIVE company absent from the file untouched', async () => {
    mockParse.mockResolvedValue({ rows: [], errors: [], year: 2025 })
    companyFindAll.mockResolvedValue([
      makeCompany({
        nationalId: '4101680229',
        status: CompanyStatusEnum.INACTIVE,
      }),
    ])

    const result = await service.preview(BUF)

    expect(result.deactivated).toHaveLength(0)
  })

  it('rejects a row with an unknown ÍSAT code', async () => {
    mockParse.mockResolvedValue({
      rows: [makeRow({ isatCategoryCode: '99999' })],
      errors: [],
      year: 2025,
    })
    isatFindAll.mockResolvedValue([]) // 99999 not known
    companyFindAll.mockResolvedValue([])

    const result = await service.preview(BUF)

    expect(result.created).toHaveLength(0)
    expect(result.invalid).toHaveLength(1)
    expect(result.invalid[0].reason).toContain('Unknown ÍSAT code')
  })

  it('adds a note when the postcode cannot be resolved (not a rejection)', async () => {
    mockParse.mockResolvedValue({
      rows: [makeRow({ postcodeCode: '999' })],
      errors: [],
      year: 2025,
    })
    postcodeFindAll.mockResolvedValue([]) // 999 not found
    companyFindAll.mockResolvedValue([])

    const result = await service.preview(BUF)

    expect(result.created).toHaveLength(1)
    expect(result.created[0].note).toContain('999')
    expect(result.noticeCount).toBe(1)
  })

  it('does not treat a company present-but-invalid as absent', async () => {
    mockParse.mockResolvedValue({
      rows: [],
      errors: [
        { row: 2, nationalId: '4101660389', reason: 'Unknown ÍSAT code "x"' },
      ],
      year: 2025,
    })
    companyFindAll.mockResolvedValue([makeCompany()])

    const result = await service.preview(BUF)

    expect(result.deactivated).toHaveLength(0)
  })

  describe('apply', () => {
    it('creates new companies and emits CREATED, inside a transaction', async () => {
      mockParse.mockResolvedValue({ rows: [makeRow()], errors: [], year: 2025 })
      companyFindAll.mockResolvedValue([])

      const result = await service.apply(BUF, 'admin-1')

      expect(transaction).toHaveBeenCalledTimes(1)
      expect(companyCreate).toHaveBeenCalledTimes(1)
      expect(emitCreated).toHaveBeenCalledWith(
        'new-1',
        expect.anything(),
        'admin-1',
      )
      expect(result.committed).toBe(true)
    })

    it('updates fields and emits STATUS_CHANGED only for status flips', async () => {
      const company = makeCompany({ status: CompanyStatusEnum.INACTIVE })
      mockParse.mockResolvedValue({
        rows: [makeRow({ name: 'Renamed ehf.' })],
        errors: [],
        year: 2025,
      })
      companyFindAll.mockResolvedValue([company])

      await service.apply(BUF, 'admin-1')

      expect(company.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Renamed ehf.',
          status: CompanyStatusEnum.ACTIVE,
        }),
      )
      expect(emitStatusChanged).toHaveBeenCalledWith(
        'c1',
        CompanyStatusEnum.INACTIVE,
        CompanyStatusEnum.ACTIVE,
        'admin-1',
        expect.any(String),
      )
    })

    it('deactivates absent companies and emits the transition', async () => {
      const company = makeCompany({ nationalId: '4101680229' })
      mockParse.mockResolvedValue({ rows: [], errors: [], year: 2025 })
      companyFindAll.mockResolvedValue([company])

      await service.apply(BUF, 'admin-1')

      expect(company.update).toHaveBeenCalledWith({
        status: CompanyStatusEnum.INACTIVE,
      })
      expect(emitStatusChanged).toHaveBeenCalledWith(
        'c1',
        CompanyStatusEnum.ACTIVE,
        CompanyStatusEnum.INACTIVE,
        'admin-1',
        expect.any(String),
      )
    })
  })

  describe('parse gate', () => {
    /**
     * Build the service against a gate that is already exhausted, so the
     * shed path is the only outcome available.
     */
    const buildWithGate = async (gate: Semaphore) => {
      const module = await Test.createTestingModule({
        providers: [
          CompanyImportService,
          { provide: LOGGER_PROVIDER, useValue: mockLogger },
          { provide: getConnectionToken(), useValue: { transaction } },
          {
            provide: getModelToken(CompanyModel),
            useValue: { findAll: companyFindAll, create: companyCreate },
          },
          {
            provide: getModelToken(IsatCategoryModel),
            useValue: { findAll: isatFindAll },
          },
          {
            provide: getModelToken(PostcodeModel),
            useValue: { findAll: postcodeFindAll },
          },
          {
            provide: ICompanyEventService,
            useValue: { emitCreated, emitStatusChanged },
          },
          { provide: PARSE_GATE, useValue: gate },
        ],
      }).compile()
      return module.get(CompanyImportService)
    }

    it('sheds with a 503 rather than parsing when the gate is saturated', async () => {
      // One slot, no queue — taking the slot leaves nothing to acquire.
      const gate = new Semaphore(1, 0)
      const held = await gate.acquire()
      const gated = await buildWithGate(gate)

      await expect(gated.preview(BUF)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      )
      // The point of gating before parsing: the expensive call never happens.
      expect(mockParse).not.toHaveBeenCalled()

      held()
    })

    it('releases its slot after a parse so later imports still run', async () => {
      const gate = new Semaphore(1, 0)
      const gated = await buildWithGate(gate)

      await gated.preview(BUF)
      expect(gate.activeCount).toBe(0)

      // A second import would deadlock on a leaked slot rather than fail.
      await expect(gated.preview(BUF)).resolves.toBeDefined()
    })

    it('releases its slot when the parse throws', async () => {
      const gate = new Semaphore(1, 0)
      const gated = await buildWithGate(gate)
      mockParse.mockRejectedValueOnce(new Error('unreadable workbook'))

      await expect(gated.preview(BUF)).rejects.toThrow('unreadable workbook')
      expect(gate.activeCount).toBe(0)
    })
  })
})
