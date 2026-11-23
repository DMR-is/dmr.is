import { Logger } from '@dmr.is/logging'
import { GetCasesQuery } from '@dmr.is/shared-dto'

import { CaseModel } from '../models'
import { findCases } from './find-cases.query'

/**
 * Pins the query options of the case list shared by the admin `CaseService`
 * and the public journal API's `CaseListService`.
 */
describe('findCases', () => {
  const findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 })
  const model = { findAndCountAll } as unknown as typeof CaseModel
  const logger = { info: jest.fn() } as unknown as Logger

  const optionsFor = async (params: Partial<GetCasesQuery>) => {
    findAndCountAll.mockClear()
    await findCases(model, params as GetCasesQuery, logger)
    return findAndCountAll.mock.calls[0][0]
  }

  it('sorts by the requested key and direction', async () => {
    const { order } = await optionsFor({
      sortBy: 'caseRegistrationDate',
      direction: 'ASC',
    } as Partial<GetCasesQuery>)
    expect(order).toEqual([['createdAt', 'ASC']])
  })

  it('puts unpublished cases last when sorting by publish date', async () => {
    const { order } = await optionsFor({
      sortBy: 'casePublishDate',
      direction: 'DESC',
    } as Partial<GetCasesQuery>)
    expect(order[0].val).toBe('"publishedAt" DESC NULLS LAST')
  })

  it('falls back to the requested publication date for an unknown sort key', async () => {
    const { order } = await optionsFor({
      sortBy: 'nonsense',
    } as Partial<GetCasesQuery>)
    expect(order).toEqual(['requestedPublicationDate'])
  })

  it('pages and counts distinct cases', async () => {
    const options = await optionsFor({ page: 2, pageSize: 10 })
    expect(options).toMatchObject({ limit: 10, offset: 10, distinct: true })
  })
})
