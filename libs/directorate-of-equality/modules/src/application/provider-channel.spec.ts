import { ReportProviderEnum } from '../report/models/report.enums'
import {
  EXTERNAL_PROVIDER_CHANNEL,
  ISLAND_IS_PROVIDER_CHANNEL,
} from './provider-channel'

describe('report provider channels', () => {
  describe('island.is', () => {
    it('files submissions as ISLAND_IS', () => {
      expect(ISLAND_IS_PROVIDER_CHANNEL.providerType).toBe(
        ReportProviderEnum.ISLAND_IS,
      )
    })

    it('stores the application id exactly as given', () => {
      // Namespacing it would be a migration of every existing row for no gain:
      // one upstream system mints these and they are already unique.
      expect(
        ISLAND_IS_PROVIDER_CHANNEL.buildProviderId('app-uuid', '5501012130'),
      ).toBe('app-uuid')
    })

    it('reads the application id back verbatim', () => {
      expect(
        ISLAND_IS_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'app-uuid',
          companyNationalId: '5501012130',
        }),
      ).toBe('app-uuid')
    })

    it('withholds the handle for a report filed on another channel', () => {
      // An admin-, Excel- or partner-created report has no island.is content
      // route, so a handle would only ever 404.
      expect(
        ISLAND_IS_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.OTHER,
          providerId: '5501012130:vendor-1',
          companyNationalId: '5501012130',
        }),
      ).toBeNull()
    })
  })

  describe('partner', () => {
    it('files submissions as OTHER, which the enum already had', () => {
      expect(EXTERNAL_PROVIDER_CHANNEL.providerType).toBe(
        ReportProviderEnum.OTHER,
      )
    })

    it('namespaces the vendor id with the company kennitala', () => {
      expect(
        EXTERNAL_PROVIDER_CHANNEL.buildProviderId('2026-Q1-042', '5501012130'),
      ).toBe('5501012130:2026-Q1-042')
    })

    it('keeps two companies apart when vendors pick the same id', () => {
      // The failure this prevents: uniqueness is on (provider_type,
      // provider_id), so without the prefix two vendors both sending "1" would
      // collide — one getting a 409 caused by an unrelated company, which also
      // leaks that the id is taken.
      const a = EXTERNAL_PROVIDER_CHANNEL.buildProviderId('1', '5501012130')
      const b = EXTERNAL_PROVIDER_CHANNEL.buildProviderId('1', '6602022240')

      expect(a).not.toBe(b)
    })

    it('reads back the vendor id it stored, without the namespace', () => {
      // The round trip is the contract: a vendor quotes its own id and never
      // sees the stored form.
      const stored = EXTERNAL_PROVIDER_CHANNEL.buildProviderId(
        '2026-Q1-042',
        '5501012130',
      )

      expect(
        EXTERNAL_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.OTHER,
          providerId: stored,
          companyNationalId: '5501012130',
        }),
      ).toBe('2026-Q1-042')
    })

    it('keeps a vendor id that contains a colon intact', () => {
      // Why this strips a prefix rather than splitting on ':' — `split(':')[1]`
      // would truncate this to 'urn'.
      const stored = EXTERNAL_PROVIDER_CHANNEL.buildProviderId(
        'urn:vendor:42',
        '5501012130',
      )

      expect(
        EXTERNAL_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.OTHER,
          providerId: stored,
          companyNationalId: '5501012130',
        }),
      ).toBe('urn:vendor:42')
    })

    it('withholds a handle stored under a different company', () => {
      // Requiring the prefix is what stops a foreign id being handed out if a
      // row is ever reached with the wrong company in context.
      expect(
        EXTERNAL_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.OTHER,
          providerId: '6602022240:vendor-1',
          companyNationalId: '5501012130',
        }),
      ).toBeNull()
    })

    it('withholds the handle for an island.is-filed report', () => {
      // The company filed this one itself; it is not addressable here.
      expect(
        EXTERNAL_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.ISLAND_IS,
          providerId: 'app-uuid',
          companyNationalId: '5501012130',
        }),
      ).toBeNull()
    })

    it.each([
      ['no provider id', null, '5501012130'],
      ['no company national id', '5501012130:vendor-1', null],
      ['neither', null, null],
    ])('withholds the handle with %s', (_label, providerId, nationalId) => {
      // Every column here is nullable on `report`.
      expect(
        EXTERNAL_PROVIDER_CHANNEL.toClientProviderId({
          providerType: ReportProviderEnum.OTHER,
          providerId,
          companyNationalId: nationalId,
        }),
      ).toBeNull()
    })

    it('is idempotent for the same company and id, so replay still matches', () => {
      // Replay protection depends on the stored tuple being reproducible from
      // the same inputs: a retry must land on the same provider_id.
      expect(EXTERNAL_PROVIDER_CHANNEL.buildProviderId('x', '5501012130')).toBe(
        EXTERNAL_PROVIDER_CHANNEL.buildProviderId('x', '5501012130'),
      )
    })
  })

  it('gives the two channels different provider types, so reads cannot cross', () => {
    expect(ISLAND_IS_PROVIDER_CHANNEL.providerType).not.toBe(
      EXTERNAL_PROVIDER_CHANNEL.providerType,
    )
  })
})
