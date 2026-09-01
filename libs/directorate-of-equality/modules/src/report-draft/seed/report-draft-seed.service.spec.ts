import { BadRequestException } from '@nestjs/common'
import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER } from '@dmr.is/logging'

import { CompanyDto } from '../../company/dto/company.dto'
import {
  CompanyReportStatusEnum,
  CompanySizeEnum,
  CompanyStatusEnum,
} from '../../company/models/company.enums'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from '../../import-upload/import-upload.service.interface'
import { ReportTypeEnum } from '../../report/models/report.model'
import { IReportContentService } from '../../report-content/report-content.service.interface'
import { IReportExcelService } from '../../report-excel/report-excel.service.interface'
import { IReportDraftService } from '../draft/report-draft.service.interface'
import { ReportDraftSeedService } from './report-draft-seed.service'

const REPORT_ID = 'report-id-1'
const KEY = 'doe-imports/application/abc.xlsx'
const PROVIDER_ID = 'island-is-application-uuid-draft'

const COMPANY = {
  id: 'company-1',
  nationalId: '5500000000',
  employeeCountCategory: CompanySizeEnum.LARGE,
  status: CompanyStatusEnum.ACTIVE,
  reportStatus: CompanyReportStatusEnum.SATISFACTORY,
} as unknown as CompanyDto

// A minimal valid parsed payload: one role, one criterion→sub→2 steps, one
// employee referencing the role. Enough to pass assertParsedPayloadIntegrity.
const validParsed = () => ({
  roles: [{ title: 'Sérfræðingur', stepAssignments: [] }],
  criteria: [
    {
      title: 'Ábyrgð',
      weight: 1,
      description: '',
      type: 'RESPONSIBILITY',
      subCriteria: [
        {
          title: 'Mannaforráð',
          description: '',
          weight: 1,
          steps: [
            { order: 1, description: 'a', score: 0 },
            { order: 2, description: 'b', score: 5 },
          ],
        },
      ],
    },
  ],
  employees: [
    {
      ordinal: 1,
      identifier: 'ABC-001',
      roleTitle: 'Sérfræðingur',
      gender: 'FEMALE',
      field: 'Eng',
      department: 'R&D',
      startDate: '2020-01-01',
      paidHours: 173.33,
      baseSalary: 800000,
      additionalFixedOvertime: null,
      additionalFixedCarAllowance: null,
      bonusOccasionalCarAllowance: null,
      bonusOccasionalOvertime: null,
      bonusPayments: null,
      bonusOther: null,
      personalStepAssignments: [],
    },
  ],
})

describe('ReportDraftSeedService', () => {
  let service: ReportDraftSeedService
  let findOwnedDraft: jest.Mock
  let clearDraftChildren: jest.Mock
  let markImportedFromExcel: jest.Mock
  let getDraftDetail: jest.Mock
  let persistParsedChildren: jest.Mock
  let importWorkbook: jest.Mock
  let fetchWorkbook: jest.Mock
  let cleanup: jest.Mock

  beforeEach(async () => {
    findOwnedDraft = jest
      .fn()
      .mockResolvedValue({ id: REPORT_ID, type: ReportTypeEnum.SALARY })
    clearDraftChildren = jest.fn().mockResolvedValue(undefined)
    markImportedFromExcel = jest.fn().mockResolvedValue(undefined)
    getDraftDetail = jest.fn().mockResolvedValue({ id: REPORT_ID })
    persistParsedChildren = jest
      .fn()
      .mockResolvedValue({ employeeOrdinalToId: new Map() })
    importWorkbook = jest.fn().mockResolvedValue(validParsed())
    fetchWorkbook = jest.fn().mockResolvedValue(Buffer.from('x'))
    cleanup = jest.fn().mockResolvedValue(undefined)

    const module = await Test.createTestingModule({
      providers: [
        ReportDraftSeedService,
        {
          provide: LOGGER_PROVIDER,
          useValue: { debug: jest.fn(), info: jest.fn(), error: jest.fn() },
        },
        {
          provide: IReportDraftService,
          useValue: {
            findOwnedDraft,
            clearDraftChildren,
            markImportedFromExcel,
            getDraftDetail,
          },
        },
        {
          provide: IReportContentService,
          useValue: { persistParsedChildren },
        },
        { provide: IReportExcelService, useValue: { importWorkbook } },
        { provide: IImportUploadService, useValue: { fetchWorkbook, cleanup } },
      ],
    }).compile()

    service = module.get(ReportDraftSeedService)
  })

  it('clears the draft then persists the parsed workbook with NULL scores', async () => {
    await service.seedFromWorkbook(PROVIDER_ID, COMPANY, KEY)

    // The key is handed to the importer, not a buffer — the download happens
    // under the parse gate inside `importWorkbook`.
    expect(importWorkbook).toHaveBeenCalledWith(
      KEY,
      ImportUploadBoundary.APPLICATION,
    )
    expect(fetchWorkbook).not.toHaveBeenCalled()
    expect(cleanup).toHaveBeenCalledWith(KEY, ImportUploadBoundary.APPLICATION)
    // clear must happen before persist (replace semantics).
    expect(clearDraftChildren).toHaveBeenCalledWith(REPORT_ID)
    expect(persistParsedChildren).toHaveBeenCalledWith(
      REPORT_ID,
      expect.anything(),
      [null], // one employee → one null score
    )
  })

  it('flags the draft as workbook-derived once the parser has run', async () => {
    // The whole point of `report.imported_from_excel`: this draft's content came
    // out of a spreadsheet, not the portal UI. This is the only place the server
    // can observe that, so the flag is set here or it is never set at all.
    await service.seedFromWorkbook(PROVIDER_ID, COMPANY, KEY)

    expect(markImportedFromExcel).toHaveBeenCalledWith(REPORT_ID)
  })

  it('flags only after the parsed content is persisted', async () => {
    // Ordering matters: a persist that throws must leave the draft claiming no
    // workbook origin, so the flag cannot be written ahead of the content.
    const order: string[] = []
    persistParsedChildren.mockImplementationOnce(async () => {
      order.push('persist')
      return { employeeOrdinalToId: new Map() }
    })
    markImportedFromExcel.mockImplementationOnce(async () => {
      order.push('mark')
    })

    await service.seedFromWorkbook(PROVIDER_ID, COMPANY, KEY)

    expect(order).toEqual(['persist', 'mark'])
  })

  it('cleans up the staged object even if parsing fails', async () => {
    importWorkbook.mockRejectedValueOnce(new Error('bad workbook'))

    await expect(
      service.seedFromWorkbook(PROVIDER_ID, COMPANY, KEY),
    ).rejects.toThrow('bad workbook')
    expect(cleanup).toHaveBeenCalledWith(KEY, ImportUploadBoundary.APPLICATION)
    expect(persistParsedChildren).not.toHaveBeenCalled()
    // Nothing was written, so nothing counts as activity and no workbook
    // origin is claimed.
    expect(markImportedFromExcel).not.toHaveBeenCalled()
  })

  it('400s on an equality draft (no clearing/persisting)', async () => {
    findOwnedDraft.mockResolvedValueOnce({
      id: REPORT_ID,
      type: ReportTypeEnum.EQUALITY,
    })

    await expect(
      service.seedFromWorkbook(PROVIDER_ID, COMPANY, KEY),
    ).rejects.toThrow(BadRequestException)
    expect(importWorkbook).not.toHaveBeenCalled()
    expect(clearDraftChildren).not.toHaveBeenCalled()
  })
})
