import { CreationAttributes } from 'sequelize'

import { ReportProviderEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { withReadHandle } from './report-create.service'

const values = (
  overrides: Partial<CreationAttributes<ReportModel>>,
): CreationAttributes<ReportModel> =>
  ({ type: 'SALARY', ...overrides }) as CreationAttributes<ReportModel>

describe('withReadHandle', () => {
  it('mints an opaque SYSTEM id for a report filed with none', () => {
    const minted = withReadHandle(
      values({ providerType: ReportProviderEnum.SYSTEM, providerId: null }),
    )

    expect(minted.providerType).toBe(ReportProviderEnum.SYSTEM)
    expect(minted.providerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('files a null id under SYSTEM whatever type was given, so no channel’s write routes can reach it', () => {
    expect(
      withReadHandle(
        values({
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: null,
        }),
      ).providerType,
    ).toBe(ReportProviderEnum.SYSTEM)
  })

  it('mints a fresh id every time', () => {
    const a = withReadHandle(values({ providerId: null }))
    const b = withReadHandle(values({ providerId: null }))

    expect(a.providerId).not.toBe(b.providerId)
  })

  it('leaves a given id and its type alone', () => {
    const given = values({
      providerType: ReportProviderEnum.OTHER,
      providerId: '5501012130:vendor-42',
    })

    expect(withReadHandle(given)).toBe(given)
  })
})
