import { ExecutionContext, NotFoundException } from '@nestjs/common'

import { ResultWrapper } from '@dmr.is/types'

import { ApplicationOwnershipGuard } from './application-ownership.guard'
import { OwnInvolvedPartyGuard } from './own-involved-party.guard'

const APPLICATION_ID = '6f1c1a3e-2b4d-4c5e-9f60-7a8b9c0d1e2f'

const application = {
  id: APPLICATION_ID,
  applicant: '0101010000',
  assignees: ['0202020000'],
  applicantActors: ['0303030000'],
}

const contextFor = (req: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({ getRequest: () => req }),
  }) as unknown as ExecutionContext

describe('ApplicationOwnershipGuard', () => {
  const getApplication = jest.fn()
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
  const guard = new ApplicationOwnershipGuard(
    logger as never,
    {
      getApplication,
    } as never,
  )

  const request = (nationalId?: string) => ({
    params: { id: APPLICATION_ID },
    user: { nationalId },
  })

  beforeEach(() => {
    jest.clearAllMocks()
    getApplication.mockResolvedValue(ResultWrapper.ok({ application }))
  })

  it('allows the applicant and puts the application on the request', async () => {
    const req = request('0101010000')

    await expect(guard.canActivate(contextFor(req))).resolves.toBe(true)
    expect(req).toHaveProperty('application', application)
    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(APPLICATION_ID)
  })

  it('allows an assignee', async () => {
    await expect(
      guard.canActivate(contextFor(request('0202020000'))),
    ).resolves.toBe(true)
  })

  it('refuses someone who only acted for the applicant, as a 404', async () => {
    await expect(
      guard.canActivate(contextFor(request('0303030000'))),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses an unrelated caller, as a 404', async () => {
    await expect(
      guard.canActivate(contextFor(request('0505050000'))),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses a caller with no national id', async () => {
    await expect(
      guard.canActivate(contextFor(request(undefined))),
    ).rejects.toThrow(NotFoundException)
  })

  it('answers a failed fetch with a 404', async () => {
    getApplication.mockResolvedValue(
      ResultWrapper.err({ code: 500, message: 'x' }),
    )
    await expect(
      guard.canActivate(contextFor(request('0101010000'))),
    ).rejects.toThrow(NotFoundException)
  })

  it('answers a fetch that throws with a 404', async () => {
    getApplication.mockRejectedValue(new Error('boom'))
    await expect(
      guard.canActivate(contextFor(request('0101010000'))),
    ).rejects.toThrow(NotFoundException)
  })

  it('refuses a request with no application id', async () => {
    await expect(
      guard.canActivate(contextFor({ params: {}, user: {} })),
    ).rejects.toThrow(NotFoundException)
    expect(getApplication).not.toHaveBeenCalled()
  })
})

describe('OwnInvolvedPartyGuard', () => {
  const guard = new OwnInvolvedPartyGuard()
  const requestFor = (involvedParties: unknown, involvedPartyId = 'party-1') =>
    contextFor({ params: { involvedPartyId }, user: { involvedParties } })

  it('allows an id from the role guard', () => {
    expect(guard.canActivate(requestFor(['party-1']))).toBe(true)
  })

  it('allows a party object from the party guard', () => {
    expect(guard.canActivate(requestFor([{ id: 'party-1' }]))).toBe(true)
  })

  it('refuses another party, and a caller with none, as a 404', () => {
    expect(() => guard.canActivate(requestFor(['party-2']))).toThrow(
      NotFoundException,
    )
    expect(() => guard.canActivate(requestFor(undefined))).toThrow(
      NotFoundException,
    )
  })
})
