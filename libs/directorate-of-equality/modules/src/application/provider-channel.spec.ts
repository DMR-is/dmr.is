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
