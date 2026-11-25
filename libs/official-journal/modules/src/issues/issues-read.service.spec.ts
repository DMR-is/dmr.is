/* eslint-disable simple-import-sort/imports */
// Load the advert-type models before the journal barrel, which otherwise
// reads AdvertDepartmentModel before it is initialised (cyclic models).
// Import sorting would move this side-effect import last, hence the disable.
import '../advert-type/models'

import { Op } from 'sequelize'

import { GetMonthlyIssuesQueryDto } from './issues.dto'
import { IssuesModel } from './issues.model'
import { IssuesReadService } from './issues-read.service'

/** Pins the query options the public `GET /issues` sends to Postgres. */
describe('IssuesReadService.getIssues', () => {
  const findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 })
  const service = new IssuesReadService({
    findAndCountAll,
  } as unknown as typeof IssuesModel)

  const whereOf = async (query: Partial<GetMonthlyIssuesQueryDto>) => {
    findAndCountAll.mockClear()
    await service.getIssues(query as GetMonthlyIssuesQueryDto)
    return findAndCountAll.mock.calls[0][0]
  }

  it('pages with limit and offset', async () => {
    const options = await whereOf({ page: 3, pageSize: 20 })
    expect(options).toMatchObject({ limit: 20, offset: 40 })
  })

  it('filters by department', async () => {
    const { where } = await whereOf({ departmentId: 'dep-a' })
    expect(where).toEqual({ departmentId: 'dep-a' })
  })

  it('bounds a month and year to that month, inclusive', async () => {
    const { where } = await whereOf({ month: 2, year: 2026 })
    expect(where.startDate[Op.gte]).toEqual(new Date(2026, 1, 1))
    expect(where.startDate[Op.lte]).toEqual(new Date(2026, 1, 28, 23, 59, 59))
  })

  it('bounds a year alone to that calendar year', async () => {
    const { where } = await whereOf({ year: 2025 })
    expect(where.startDate[Op.gte]).toEqual(new Date(2025, 0, 1))
    expect(where.startDate[Op.lte]).toEqual(new Date(2025, 11, 31, 23, 59, 59))
  })

  it('matches a month alone across every year', async () => {
    const { where } = await whereOf({ month: 7 })
    expect(where.startDate).toBeUndefined()
    expect(where[Op.and]).toHaveLength(1)
  })
})
