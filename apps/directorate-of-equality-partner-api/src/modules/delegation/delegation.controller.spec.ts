import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { GUARDS_METADATA } from '@nestjs/common/constants'

import { ApiKeyKindEnum } from '@dmr.is/doe-shared'

import { PartnerClientGuard } from '../../core/guards/partner-client/partner-client.guard'
import { COMPANY_NATIONAL_ID_HEADER } from '../../core/guards/partner-company/partner-company.guard'
import { DelegationController } from './delegation.controller'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('DelegationController', () => {
  let listLiveForClient: jest.Mock
  let controller: DelegationController

  beforeEach(() => {
    listLiveForClient = jest.fn().mockResolvedValue([])
    controller = new DelegationController({ listLiveForClient } as never)
  })

  it('lists the delegations of the firm the key belongs to', async () => {
    await controller.getDelegations({
      kind: ApiKeyKindEnum.PARTNER_CLIENT,
      partnerClientId: 'client-a',
    } as never)

    expect(listLiveForClient).toHaveBeenCalledWith('client-a')
  })

  it('refuses a company key even if the guard were removed', async () => {
    await expect(
      controller.getDelegations({ kind: ApiKeyKindEnum.COMPANY } as never),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(listLiveForClient).not.toHaveBeenCalled()
  })

  /** The guard the handler's own check backs up — asserted on the class. */
  it('is guarded by PartnerClientGuard', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, DelegationController),
    ).toContain(PartnerClientGuard)
  })

  it('refuses X-Company-National-Id rather than ignoring it', () => {
    const guard = new PartnerClientGuard(logger as never)
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { [COMPANY_NATIONAL_ID_HEADER]: '1111111111' },
          apiKeyContext: { kind: ApiKeyKindEnum.PARTNER_CLIENT },
        }),
      }),
    } as never

    expect(() => guard.canActivate(context)).toThrow(BadRequestException)
  })
})
