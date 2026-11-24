import {
  BadGatewayException,
  BadRequestException,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common'

import { UserRoleEnum } from '@dmr.is/constants'
import { ResultWrapper } from '@dmr.is/types'

import { ApplicationOwnershipGuard } from './application-ownership.guard'
import { APPLICATION_REQUEST_KEY } from './current-application.decorator'
import { InvolvedPartyGuard } from './involved-party.guard'
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
    expect(req).toHaveProperty(APPLICATION_REQUEST_KEY, application)
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

  it('answers an application that does not exist with a 404', async () => {
    getApplication.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'x' }),
    )
    await expect(
      guard.canActivate(contextFor(request('0101010000'))),
    ).rejects.toThrow(NotFoundException)
  })

  it.each([400, 404, 410, 422])(
    'answers an upstream %s like a missing application, with a 404',
    async (code) => {
      getApplication.mockResolvedValue(
        ResultWrapper.err({ code, message: 'x' }),
      )
      await expect(
        guard.canActivate(contextFor(request('0101010000'))),
      ).rejects.toThrow(NotFoundException)
    },
  )

  it.each([500, 502, 503, 401, 403, 405, 408, 409, 415, 429])(
    'answers an upstream %s as a 502, not as a missing application',
    async (code) => {
      getApplication.mockResolvedValue(
        ResultWrapper.err({ code, message: 'x' }),
      )
      await expect(
        guard.canActivate(contextFor(request('0101010000'))),
      ).rejects.toThrow(BadGatewayException)
      expect(logger.warn).toHaveBeenCalled()
    },
  )

  it.each([undefined, 'not-a-uuid', '../secret'])(
    'answers id %p with a 400 before any fetch',
    async (id) => {
      await expect(
        guard.canActivate(
          contextFor({ params: { id }, user: { nationalId: '0101010000' } }),
        ),
      ).rejects.toThrow(BadRequestException)
      expect(getApplication).not.toHaveBeenCalled()
    },
  )
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

describe('OwnInvolvedPartyGuard admin', () => {
  const guard = new OwnInvolvedPartyGuard()

  it('lets an editorial admin read any involved party', () => {
    expect(
      guard.canActivate(
        contextFor({
          params: { involvedPartyId: 'party-9' },
          user: { role: { title: UserRoleEnum.Admin }, involvedParties: [] },
        }),
      ),
    ).toBe(true)
  })

  it('does not extend that to other roles', () => {
    expect(() =>
      guard.canActivate(
        contextFor({
          params: { involvedPartyId: 'party-9' },
          user: { role: { title: UserRoleEnum.Editor }, involvedParties: [] },
        }),
      ),
    ).toThrow(NotFoundException)
  })
})

describe('InvolvedPartyGuard', () => {
  const getCaseInvolvedPartyByApplicationId = jest.fn()
  const institutionLookup = jest.fn()
  const logger = { warn: jest.fn(), error: jest.fn(), info: jest.fn() }
  const guard = new InvolvedPartyGuard(
    logger as never,
    { getCaseInvolvedPartyByApplicationId, institutionLookup } as never,
  )
  const requestFor = (involvedParties: unknown) =>
    contextFor({
      params: { id: 'app-1' },
      user: {
        role: { title: UserRoleEnum.Editor },
        nationalId: '0101010000',
        involvedParties,
      },
    })

  beforeEach(() => {
    jest.resetAllMocks()
    getCaseInvolvedPartyByApplicationId.mockResolvedValue(
      ResultWrapper.ok({ involvedPartyId: 'party-1' }),
    )
  })

  it('accepts ids from the role guard', async () => {
    await expect(guard.canActivate(requestFor(['party-1']))).resolves.toBe(true)
  })

  it('accepts party objects from the party guard', async () => {
    await expect(
      guard.canActivate(requestFor([{ id: 'party-1' }])),
    ).resolves.toBe(true)
  })

  it('refuses a caller with no matching party', async () => {
    institutionLookup.mockResolvedValue(
      ResultWrapper.ok({ nationalId: '0909090000' }),
    )
    await expect(
      guard.canActivate(requestFor([{ id: 'party-2' }])),
    ).resolves.toBe(false)
  })
})
