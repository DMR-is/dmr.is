import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { CompanyResourceGuard } from '../../core/guards/company-resource/company-resource.guard'
import {
  assertIdentityGuarded,
  assertTokenSurface,
  ISLAND_IS_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
} from '../../core/guards/token-surface/token-surface.testing'
import { ApplicationPartnerController } from './application-partner.controller'

/** Placeholder kennitölur — shape only, never checksum-valid. */
const COMPANY = {
  id: 'company-x',
  nationalId: '1111111111',
  status: 'ACTIVE',
} as never

/** A procuration login: the company is the subject, the person is the actor. */
const USER = {
  nationalId: '1111111111',
  actor: { nationalId: '0000000000', name: 'Jóna Jónsdóttir' },
} as never

/**
 * Constructed directly, as `PartnerController`'s spec is: the subject is what
 * the handlers pass down — whose company, which person — not the guards.
 */
describe('ApplicationPartnerController', () => {
  describe('token surface (#1568)', () => {
    const methods = [
      'getPartnerProviders',
      'getPartnerDelegations',
      'grantPartnerDelegation',
      'revokePartnerDelegation',
    ]

    it.each(methods)('%s runs behind the identity guard', (method) => {
      expect(() =>
        assertIdentityGuarded(
          ApplicationPartnerController,
          method,
          CompanyResourceGuard,
        ),
      ).not.toThrow()
    })

    it('that guard admits its own surface and refuses any other token', async () => {
      await expect(
        assertTokenSurface(CompanyResourceGuard, {
          accepts: [ISLAND_IS_APPLICATION_SCOPE, PARTNER_WEB_SCOPE],
        }),
      ).resolves.toBeUndefined()
    })
  })

  let clients: { listProviders: jest.Mock }
  let delegations: {
    listLiveForCompany: jest.Mock
    grant: jest.Mock
    revoke: jest.Mock
  }
  let controller: ApplicationPartnerController

  beforeEach(() => {
    clients = { listProviders: jest.fn().mockResolvedValue([]) }
    delegations = {
      listLiveForCompany: jest.fn().mockResolvedValue([]),
      grant: jest.fn().mockResolvedValue({}),
      revoke: jest.fn().mockResolvedValue({}),
    }
    controller = new ApplicationPartnerController(
      clients as never,
      delegations as never,
    )
  })

  describe('consent', () => {
    it('grants for the signed-in company, recording the person behind the login', async () => {
      await controller.grantPartnerDelegation(COMPANY, USER, {
        partnerClientId: 'client-a',
        scopes: [ApiKeyScopeEnum.REPORT_READ],
      })

      expect(delegations.grant).toHaveBeenCalledWith({
        company: COMPANY,
        partnerClientId: 'client-a',
        scopes: [ApiKeyScopeEnum.REPORT_READ],
        actorNationalId: '0000000000',
        actorName: 'Jóna Jónsdóttir',
      })
    })

    it('withdraws only within the signed-in company', async () => {
      await controller.revokePartnerDelegation('d-1', COMPANY, USER)

      expect(delegations.revoke).toHaveBeenCalledWith({
        id: 'd-1',
        company: COMPANY,
        actorNationalId: '0000000000',
      })
    })
  })
})
