/* eslint-disable simple-import-sort/imports */
// Load the advert-type models before the journal barrel, which otherwise
// reads AdvertDepartmentModel before it is initialised (cyclic models).
// Import sorting would move this side-effect import last, hence the disable.
import '../advert-type/models'

import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { Op } from 'sequelize'

import { getModelToken } from '@nestjs/sequelize'
import { Test } from '@nestjs/testing'

import {
  AdvertStatus,
  GetRegulationAppendicesQuery,
  MAX_REGULATION_APPENDICES_LOOKUP,
} from '@dmr.is/shared-dto'

import { AdvertModel } from '../journal/models'
import {
  PUBLIC_ADVERT_STATUSES,
  REGULATION_DEPARTMENT_SLUG,
  RegulationAppendicesService,
} from './regulation-appendices.service'

type FakeAddition = {
  id: string
  title: string
  content: string
  CaseAdditionsModel: { order: number }
}

const addition = (id: string, order: number): FakeAddition => ({
  id,
  title: `Viðauki ${id}`,
  content: `<p>${id}</p>`,
  CaseAdditionsModel: { order },
})

const advertRow = (
  serialNumber: number,
  publicationYear: number,
  options: {
    status?: string
    additions?: FakeAddition[]
    noCase?: boolean
    noType?: boolean
  } = {},
) => ({
  id: `advert-${serialNumber}-${publicationYear}`,
  serialNumber,
  publicationYear,
  status: { title: options.status ?? AdvertStatus.Published },
  type: options.noType
    ? null
    : { slug: 'b-deild-reglugerd', title: 'Reglugerð' },
  case: options.noCase
    ? null
    : { id: 'case', additions: options.additions ?? [] },
})

describe('RegulationAppendicesService', () => {
  let service: RegulationAppendicesService
  let findAll: jest.Mock

  beforeEach(async () => {
    findAll = jest.fn().mockResolvedValue([])

    const module = await Test.createTestingModule({
      providers: [
        RegulationAppendicesService,
        { provide: getModelToken(AdvertModel), useValue: { findAll } },
      ],
    }).compile()

    service = module.get(RegulationAppendicesService)
  })

  it('returns appendices in order, with one entry per requested number', async () => {
    findAll.mockResolvedValue([
      advertRow(1000, 2026, {
        additions: [addition('b', 1), addition('a', 0)],
      }),
      advertRow(1001, 2026),
    ])

    const result = await service.getAppendices([
      '1001/2026',
      '01000/2026',
      '1002/2026',
    ])

    expect(result.unwrap()).toEqual({
      items: [
        {
          publicationNumber: '1001/2026',
          advertId: 'advert-1001-2026',
          status: AdvertStatus.Published,
          type: { slug: 'b-deild-reglugerd', title: 'Reglugerð' },
          appendices: [],
        },
        {
          publicationNumber: '1000/2026',
          advertId: 'advert-1000-2026',
          status: AdvertStatus.Published,
          type: { slug: 'b-deild-reglugerd', title: 'Reglugerð' },
          appendices: [
            { id: 'a', title: 'Viðauki a', html: '<p>a</p>', order: 0 },
            { id: 'b', title: 'Viðauki b', html: '<p>b</p>', order: 1 },
          ],
        },
        {
          publicationNumber: '1002/2026',
          advertId: null,
          status: null,
          type: null,
          appendices: null,
        },
      ],
    })
  })

  it('returns a revoked advert with its status, for the importer to decide', async () => {
    findAll.mockResolvedValue([
      advertRow(5, 2026, {
        status: AdvertStatus.Revoked,
        additions: [addition('a', 0)],
      }),
    ])

    const [item] = (await service.getAppendices(['5/2026'])).unwrap().items

    expect(item.status).toBe(AdvertStatus.Revoked)
    expect(item.appendices).toHaveLength(1)
  })

  it('reports appendices of an advert without a case as unknown (null), not none', async () => {
    findAll.mockResolvedValue([advertRow(5, 2026, { noCase: true })])

    const [item] = (await service.getAppendices(['5/2026'])).unwrap().items

    expect(item.advertId).toBe('advert-5-2026')
    expect(item.appendices).toBeNull()
  })

  it('reports a case with no additions as having none ([])', async () => {
    findAll.mockResolvedValue([advertRow(5, 2026, { additions: [] })])

    const [item] = (await service.getAppendices(['5/2026'])).unwrap().items

    expect(item.appendices).toEqual([])
  })

  it('returns the advert type, or null when the advert has none', async () => {
    findAll.mockResolvedValue([
      advertRow(5, 2026),
      advertRow(6, 2026, { noType: true }),
    ])

    const items = (await service.getAppendices(['5/2026', '6/2026'])).unwrap()
      .items

    expect(items.map((item) => item.type)).toEqual([
      { slug: 'b-deild-reglugerd', title: 'Reglugerð' },
      null,
    ])
  })

  it('queries one serial-number list per year, B-deild and public statuses only', async () => {
    await service.getAppendices(['1/2025', '2/2026', '3/2025'])

    expect(findAll).toHaveBeenCalledTimes(1)
    const [options] = findAll.mock.calls[0]

    expect(options.where[Op.or]).toEqual([
      { publicationYear: 2025, serialNumber: { [Op.in]: [1, 3] } },
      { publicationYear: 2026, serialNumber: { [Op.in]: [2] } },
    ])

    const [department, status] = options.include
    expect(department).toMatchObject({
      where: { slug: REGULATION_DEPARTMENT_SLUG },
      required: true,
    })
    expect(status).toMatchObject({
      where: { title: { [Op.in]: PUBLIC_ADVERT_STATUSES } },
      required: true,
    })
  })

  it('never lets a non-public status through the allow-list', () => {
    for (const hidden of [
      AdvertStatus.Draft,
      AdvertStatus.Rejected,
      AdvertStatus.Waiting,
      AdvertStatus.InProgress,
      AdvertStatus.Submitted,
      AdvertStatus.ReadyForPublication,
    ]) {
      expect(PUBLIC_ADVERT_STATUSES).not.toContain(hidden)
    }
  })

  it('rejects the whole request with 400 when a number is malformed, without querying', async () => {
    const result = await service.getAppendices(['1000/2026', '1000'])

    expect(result.result).toMatchObject({
      ok: false,
      error: { code: 400 },
    })
    expect(findAll).not.toHaveBeenCalled()
  })
})

describe('GetRegulationAppendicesQuery', () => {
  const errorsFor = async (publicationNumber: unknown) =>
    validate(
      plainToInstance(GetRegulationAppendicesQuery, { publicationNumber }),
    )

  it('accepts a single occurrence of the parameter as a one-item list', async () => {
    const query = plainToInstance(GetRegulationAppendicesQuery, {
      publicationNumber: '1000/2026',
    })

    expect(query.publicationNumber).toEqual(['1000/2026'])
    expect(await validate(query)).toHaveLength(0)
  })

  it('accepts exactly the cap', async () => {
    const atCap = Array.from(
      { length: MAX_REGULATION_APPENDICES_LOOKUP },
      (_, i) => `${i + 1}/2026`,
    )

    expect(await errorsFor(atCap)).toHaveLength(0)
  })

  it('rejects more than the cap', async () => {
    const overCap = Array.from(
      { length: MAX_REGULATION_APPENDICES_LOOKUP + 1 },
      (_, i) => `${i + 1}/2026`,
    )

    expect(await errorsFor(overCap)).not.toHaveLength(0)
  })

  it('rejects a missing parameter', async () => {
    expect(await errorsFor(undefined)).not.toHaveLength(0)
  })
})
