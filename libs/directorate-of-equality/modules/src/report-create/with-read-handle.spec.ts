import { CreationAttributes } from 'sequelize'

import { ISLAND_IS_PROVIDER_CHANNEL } from '../application/provider-channel'
import { ReportProviderEnum } from '../report/models/report.enums'
import { ReportModel } from '../report/models/report.model'
import { withReadHandle } from './report-create.service'

const values = (
  overrides: Partial<CreationAttributes<ReportModel>>,
): CreationAttributes<ReportModel> =>
  ({ type: 'SALARY', ...overrides }) as CreationAttributes<ReportModel>

describe('withReadHandle', () => {
  it('mints an opaque id for a SYSTEM report filed with none', () => {
    const minted = withReadHandle(
      values({ providerType: ReportProviderEnum.SYSTEM, providerId: null }),
    )

    expect(minted.providerType).toBe(ReportProviderEnum.SYSTEM)
    expect(minted.providerId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('so a newly created id-less report gets a system: handle', () => {
    const minted = withReadHandle(
      values({ providerType: ReportProviderEnum.SYSTEM, providerId: null }),
    )

    expect(
      ISLAND_IS_PROVIDER_CHANNEL.toReadHandle({
        providerType: minted.providerType ?? null,
        providerId: minted.providerId ?? null,
        companyNationalId: '5501012130',
      }),
    ).toBe(`system:${minted.providerId}`)
  })

  it('mints a fresh id every time', () => {
    const system = values({
      providerType: ReportProviderEnum.SYSTEM,
      providerId: null,
    })

    expect(withReadHandle(system).providerId).not.toBe(
      withReadHandle(system).providerId,
    )
  })

  it.each([ReportProviderEnum.ISLAND_IS, ReportProviderEnum.OTHER])(
    'never reclassifies or invents an id for a %s report',
    (providerType) => {
      const given = values({ providerType, providerId: null })

      expect(withReadHandle(given)).toBe(given)
    },
  )

  it('leaves a given id alone', () => {
    const given = values({
      providerType: ReportProviderEnum.SYSTEM,
      providerId: 'k3j9x2ab7q',
    })

    expect(withReadHandle(given)).toBe(given)
  })
})
