import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ISLAND_IS_APPLICATION_SCOPE,
  PARTNER_WEB_SCOPE,
} from '../token-surface/token-surface'
import {
  PartnerClientResourceGuard,
  PartnerClientResourceRequest,
} from './partner-client-resource.guard'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('PartnerClientResourceGuard', () => {
  let findLiveByNationalId: jest.Mock
  let guard: PartnerClientResourceGuard

  const run = async (user: PartnerClientResourceRequest['user']) => {
    const request: PartnerClientResourceRequest = { user }
    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as never)
    return request
  }

  beforeEach(() => {
    findLiveByNationalId = jest.fn().mockResolvedValue(null)
    guard = new PartnerClientResourceGuard(
      logger as never,
      {
        findLiveByNationalId,
      } as never,
    )
  })

  /**
   * The reason this guard exists: an approved firm outside the employer
   * register has no company row, and must still reach its own keys. Nothing
   * here consults the company table — there is no company service to call.
   */
  it('resolves an approved provider that has no company row', async () => {
    findLiveByNationalId.mockResolvedValue({ id: 'client-a' })

    const request = await run({
      nationalId: '9999999999',
      scope: [PARTNER_WEB_SCOPE],
    } as never)

    expect(findLiveByNationalId).toHaveBeenCalledWith('9999999999')
    expect(request.partnerClientContext).toEqual({ id: 'client-a' })
  })

  it('404s an organisation that is not an approved provider, in Icelandic too', async () => {
    const error = await run({
      nationalId: '1111111111',
      scope: [PARTNER_WEB_SCOPE],
    } as never).catch((e) => e)

    expect(error).toBeInstanceOf(NotFoundException)
    expect(error.getResponse()).toMatchObject({
      translatedMessage: expect.any(String),
    })
  })

  it('refuses a token with no kennitala', async () => {
    await expect(run(undefined)).rejects.toBeInstanceOf(UnauthorizedException)
    expect(findLiveByNationalId).not.toHaveBeenCalled()
  })

  // Vendor keys are partner-web's alone; the island.is application channel
  // never manages them.
  it('refuses an island.is application token before looking up the provider', async () => {
    await expect(
      run({
        nationalId: '9999999999',
        scope: [ISLAND_IS_APPLICATION_SCOPE],
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException)
    expect(findLiveByNationalId).not.toHaveBeenCalled()
  })
})
