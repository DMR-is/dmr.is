import { ApiKeyOriginEnum, ApiKeyScopeEnum } from '@dmr.is/doe-shared'

import { PartnerClientController } from './partner-client.controller'

const ADMIN = { id: 'admin-1' } as never

/**
 * Constructed directly: the subject is what the handlers pass down — that the
 * approving or issuing admin is recorded, and that a key issued here is on the
 * ADMIN path — not the guards, which the swagger coverage spec pins.
 */
describe('PartnerClientController', () => {
  let service: {
    create: jest.Mock
    revoke: jest.Mock
    issueKey: jest.Mock
    revokeKey: jest.Mock
  }
  let controller: PartnerClientController

  beforeEach(() => {
    service = {
      create: jest.fn().mockResolvedValue({}),
      revoke: jest.fn().mockResolvedValue({}),
      issueKey: jest.fn().mockResolvedValue({}),
      revokeKey: jest.fn().mockResolvedValue({}),
    }
    controller = new PartnerClientController(service as never)
  })

  it('records the approving admin', async () => {
    await controller.createPartnerClient(ADMIN, {
      nationalId: '1111111111',
      name: 'Kjarni',
      scopes: [ApiKeyScopeEnum.REPORT_READ],
    })

    expect(service.create).toHaveBeenCalledWith({
      nationalId: '1111111111',
      name: 'Kjarni',
      scopes: [ApiKeyScopeEnum.REPORT_READ],
      actorUserId: 'admin-1',
    })
  })

  it('issues keys on the ADMIN path, attributed to the reviewer', async () => {
    await controller.issuePartnerClientKey('client-a', ADMIN, { label: 'x' })

    expect(service.issueKey).toHaveBeenCalledWith({
      partnerClientId: 'client-a',
      createdVia: ApiKeyOriginEnum.ADMIN,
      actorUserId: 'admin-1',
      label: 'x',
      expiresAt: undefined,
    })
  })

  it('revokes a key only within the firm named in the path', async () => {
    await controller.revokePartnerClientKey('client-a', 'key-1', ADMIN)

    expect(service.revokeKey).toHaveBeenCalledWith({
      id: 'key-1',
      partnerClientId: 'client-a',
      actorUserId: 'admin-1',
    })
  })
})
