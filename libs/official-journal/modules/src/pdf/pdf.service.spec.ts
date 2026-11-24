import { Test } from '@nestjs/testing'

import { LOGGER_PROVIDER, LoggingModule } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'

import { IUtilityService } from '../utility/utility.service.interface'
import { isApplicationParty, PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'
describe('PdfService', () => {
  let service: IPdfService
  beforeAll(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggingModule],
      providers: [
        {
          provide: IPdfService,
          useClass: PdfService,
        },
        {
          provide: LOGGER_PROVIDER,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: IUtilityService,
          useValue: () => ({}),
        },
        {
          provide: IAWSService,
          useValue: () => ({}),
        },
      ],
    }).compile()
    service = app.get<IPdfService>(IPdfService)
  })
  describe('Should exists', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })
  })
})

describe('isApplicationParty', () => {
  const application = {
    applicant: '0101010000',
    assignees: ['0202020000'],
    applicantActors: ['0303030000'],
  }

  it('allows the applicant', () => {
    expect(isApplicationParty(application, { nationalId: '010101-0000' })).toBe(
      true,
    )
  })

  it('allows a delegate acting for the applicant', () => {
    expect(
      isApplicationParty(application, {
        nationalId: '0101010000',
        actorNationalId: '0909090000',
      }),
    ).toBe(true)
  })

  it('allows an applicant actor signed in as actor', () => {
    expect(
      isApplicationParty(application, {
        nationalId: '0404040000',
        actorNationalId: '0303030000',
      }),
    ).toBe(true)
  })

  it('allows an assignee', () => {
    expect(isApplicationParty(application, { nationalId: '0202020000' })).toBe(
      true,
    )
  })

  it('denies an unrelated caller', () => {
    expect(
      isApplicationParty(application, {
        nationalId: '0505050000',
        actorNationalId: '0606060000',
      }),
    ).toBe(false)
  })

  it('denies a caller with no identity', () => {
    expect(isApplicationParty(application, {})).toBe(false)
    expect(isApplicationParty({ ...application, applicant: '' }, {})).toBe(
      false,
    )
  })
})

describe('PdfService.getPdfByApplicationId access', () => {
  const build = (applicationLookup: jest.Mock) =>
    new PdfService(
      { applicationLookup } as never,
      { info: jest.fn(), warn: jest.fn(), error: jest.fn() } as never,
    )

  it('returns 404 for a caller who is not a party', async () => {
    const service = build(
      jest.fn().mockResolvedValue({
        result: {
          ok: true,
          value: {
            application: {
              applicant: '0101010000',
              assignees: [],
              applicantActors: [],
            },
          },
        },
      }),
    )
    const res = await service.getPdfByApplicationId('id', {
      nationalId: '0505050000',
    })
    expect(res.result.ok).toBe(false)
    expect((res.result as { error: { code: number } }).error.code).toBe(404)
  })

  it('returns 404 when the application cannot be fetched', async () => {
    const service = build(
      jest.fn().mockResolvedValue({ result: { ok: false, error: {} } }),
    )
    const res = await service.getPdfByApplicationId('id', {
      nationalId: '0101010000',
    })
    expect((res.result as { error: { code: number } }).error.code).toBe(404)
  })
})
