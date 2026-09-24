import { ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { PartnerDelegationService } from './partner-delegation.service'

describe('PartnerDelegationService', () => {
  let findOne: jest.Mock
  let findAll: jest.Mock
  let companyFindAll: jest.Mock
  let service: PartnerDelegationService

  beforeEach(() => {
    findOne = jest.fn().mockResolvedValue(null)
    findAll = jest.fn().mockResolvedValue([])
    companyFindAll = jest.fn().mockResolvedValue([])
    service = new PartnerDelegationService(
      { findOne, findAll } as never,
      { findAll: companyFindAll } as never,
    )
  })

  /**
   * The one lookup the guard and the self-service web both use. It must only
   * ever answer with a live row: a withdrawn delegation that still resolved
   * would let a firm keep filing after the company said no.
   */
  it('looks up the live delegation only', async () => {
    await service.findLive('client-a', '1111111111')

    expect(findOne).toHaveBeenCalledWith({
      where: {
        partnerClientId: 'client-a',
        companyNationalId: '1111111111',
        revokedAt: null,
      },
    })
  })

  it('lists a firm’s live delegations, newest first, with company names', async () => {
    const grantedAt = new Date('2026-09-23T10:00:00.000Z')
    findAll.mockResolvedValue([
      {
        id: 'd-1',
        companyId: 'company-x',
        companyNationalId: '1111111111',
        scopes: [ApiKeyScopeEnum.REPORT_READ],
        createdAt: grantedAt,
      },
    ])
    companyFindAll.mockResolvedValue([{ id: 'company-x', name: 'X ehf.' }])

    await expect(service.listLiveForClient('client-a')).resolves.toEqual([
      {
        id: 'd-1',
        companyNationalId: '1111111111',
        companyName: 'X ehf.',
        scopes: [ApiKeyScopeEnum.REPORT_READ],
        grantedAt,
      },
    ])
    expect(findAll).toHaveBeenCalledWith({
      where: { partnerClientId: 'client-a', revokedAt: null },
      order: [['created_at', 'DESC']],
    })
  })

  it('does not query companies for a firm with no delegations', async () => {
    await expect(service.listLiveForClient('client-a')).resolves.toEqual([])
    expect(companyFindAll).not.toHaveBeenCalled()
  })
})
