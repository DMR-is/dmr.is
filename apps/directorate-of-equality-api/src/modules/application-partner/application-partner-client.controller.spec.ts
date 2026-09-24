import { ApiKeyOriginEnum } from '@dmr.is/doe-shared'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import { PartnerClientResourceGuard } from '../../core/guards/partner-client-resource/partner-client-resource.guard'
import { ApplicationPartnerController } from './application-partner.controller'
import { ApplicationPartnerClientController } from './application-partner-client.controller'

const CLIENT = { id: 'client-a', nationalId: '9999999999' } as never

/** A procuration login: the firm is the subject, the person is the actor. */
const USER = {
  nationalId: '9999999999',
  actor: { nationalId: '0000000000' },
} as never

/**
 * Constructed directly: the subject is that every handler acts for the firm
 * `PartnerClientResourceGuard` resolved, attributed to the person signed in.
 */
describe('ApplicationPartnerClientController', () => {
  let service: {
    listKeys: jest.Mock
    issueKey: jest.Mock
    revokeKey: jest.Mock
  }
  let controller: ApplicationPartnerClientController

  beforeEach(() => {
    service = {
      listKeys: jest.fn().mockResolvedValue([]),
      issueKey: jest.fn().mockResolvedValue({}),
      revokeKey: jest.fn().mockResolvedValue({}),
    }
    controller = new ApplicationPartnerClientController(service as never)
  })

  /**
   * The regression the move fixed: a provider with no company row was 404ed by
   * CompanyResourceGuard before its own record was looked up. The handler
   * tests above call methods directly and cannot see guards, so the guard
   * chain is pinned here — re-adding CompanyResourceGuard, or moving these
   * routes back beside the consent routes, fails this. `__guards__` is Nest's
   * @UseGuards metadata key, as swagger-coverage.spec reads it.
   */
  it('is guarded by PartnerClientResourceGuard and never CompanyResourceGuard', () => {
    const guards = Reflect.getMetadata(
      '__guards__',
      ApplicationPartnerClientController,
    )

    expect(guards).toEqual([TokenJwtAuthGuard, PartnerClientResourceGuard])
    expect(guards).not.toContain(CompanyResourceGuard)
  })

  it('has no provider routes left on the consent controller', () => {
    const prototype =
      ApplicationPartnerController.prototype as unknown as Record<
        string,
        unknown
      >

    for (const handler of [
      'getPartnerClient',
      'getPartnerClientKeys',
      'issuePartnerClientKey',
      'revokePartnerClientKey',
    ]) {
      expect(prototype[handler]).toBeUndefined()
    }
  })

  it('returns the resolved provider as is', () => {
    expect(controller.getPartnerClient(CLIENT)).toBe(CLIENT)
  })

  it('lists only the resolved provider’s keys', async () => {
    await controller.getPartnerClientKeys(CLIENT)

    expect(service.listKeys).toHaveBeenCalledWith('client-a')
  })

  it('mints on the self-service path, attributed to the person', async () => {
    await controller.issuePartnerClientKey(CLIENT, USER, { label: 'prod' })

    expect(service.issueKey).toHaveBeenCalledWith({
      partnerClientId: 'client-a',
      createdVia: ApiKeyOriginEnum.ISLAND_IS,
      actorNationalId: '0000000000',
      label: 'prod',
      expiresAt: undefined,
    })
  })

  it('revokes only among the provider’s own keys', async () => {
    await controller.revokePartnerClientKey('k-1', CLIENT, USER)

    expect(service.revokeKey).toHaveBeenCalledWith({
      id: 'k-1',
      partnerClientId: 'client-a',
      actorNationalId: '0000000000',
    })
  })
})
