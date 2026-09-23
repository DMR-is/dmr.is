import { NotFoundException } from '@nestjs/common'

import { ApiKeyOriginEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

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
  actor: { nationalId: '0000000000' },
} as never

/**
 * Constructed directly, as `PartnerController`'s spec is: the subject is what
 * the handlers pass down — whose company, which person — not the guards.
 */
describe('ApplicationPartnerController', () => {
  let clients: {
    listProviders: jest.Mock
    findLiveByNationalId: jest.Mock
    listKeys: jest.Mock
    issueKey: jest.Mock
    revokeKey: jest.Mock
  }
  let delegations: {
    listLiveForCompany: jest.Mock
    grant: jest.Mock
    revoke: jest.Mock
  }
  let controller: ApplicationPartnerController

  beforeEach(() => {
    clients = {
      listProviders: jest.fn().mockResolvedValue([]),
      findLiveByNationalId: jest.fn().mockResolvedValue(null),
      listKeys: jest.fn().mockResolvedValue([]),
      issueKey: jest.fn().mockResolvedValue({}),
      revokeKey: jest.fn().mockResolvedValue({}),
    }
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

  describe('a provider’s own keys', () => {
    it('404s every route for a company that is not an approved provider', async () => {
      await expect(controller.getPartnerClient(COMPANY)).rejects.toBeInstanceOf(
        NotFoundException,
      )
      await expect(
        controller.getPartnerClientKeys(COMPANY),
      ).rejects.toBeInstanceOf(NotFoundException)
      await expect(
        controller.issuePartnerClientKey(COMPANY, USER, {}),
      ).rejects.toBeInstanceOf(NotFoundException)
      await expect(
        controller.revokePartnerClientKey('k-1', COMPANY, USER),
      ).rejects.toBeInstanceOf(NotFoundException)
      expect(clients.issueKey).not.toHaveBeenCalled()
    })

    it('resolves the provider from the signed-in company’s own kennitala', async () => {
      clients.findLiveByNationalId.mockResolvedValue({ id: 'client-a' })

      await controller.getPartnerClientKeys(COMPANY)

      expect(clients.findLiveByNationalId).toHaveBeenCalledWith('1111111111')
      expect(clients.listKeys).toHaveBeenCalledWith('client-a')
    })

    it('mints on the self-service path, attributed to the person', async () => {
      clients.findLiveByNationalId.mockResolvedValue({ id: 'client-a' })

      await controller.issuePartnerClientKey(COMPANY, USER, { label: 'prod' })

      expect(clients.issueKey).toHaveBeenCalledWith({
        partnerClientId: 'client-a',
        createdVia: ApiKeyOriginEnum.ISLAND_IS,
        actorNationalId: '0000000000',
        label: 'prod',
        expiresAt: undefined,
      })
    })

    it('revokes only among the provider’s own keys', async () => {
      clients.findLiveByNationalId.mockResolvedValue({ id: 'client-a' })

      await controller.revokePartnerClientKey('k-1', COMPANY, USER)

      expect(clients.revokeKey).toHaveBeenCalledWith({
        id: 'k-1',
        partnerClientId: 'client-a',
        actorNationalId: '0000000000',
      })
    })
  })
})
