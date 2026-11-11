import { ForbiddenException } from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { AdminGuard } from './admin.guard'

const STAFF_CLIENT_ID = 'doe-web-client'

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

const createUser = (nationalId: string): DMRUser =>
  ({
    nationalId,
    name: 'Test User',
    fullName: 'Test User',
    scope: [],
    client: 'test',
    authorization: 'Bearer test',
    aud: STAFF_CLIENT_ID,
  }) as DMRUser

const createExecutionContext = (request: Record<string, unknown>) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as never

describe('AdminGuard', () => {
  const authorizationService = {
    resolveAdminUser: jest.fn(),
  }

  let guard: AdminGuard

  const originalClientId = process.env.DOE_WEB_CLIENT_ID

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DOE_WEB_CLIENT_ID = STAFF_CLIENT_ID
    guard = new AdminGuard(logger as never, authorizationService as never)
  })

  afterAll(() => {
    if (originalClientId === undefined) {
      delete process.env.DOE_WEB_CLIENT_ID
    } else {
      process.env.DOE_WEB_CLIENT_ID = originalClientId
    }
  })

  it('allows an active reviewer and attaches adminUser to the request', async () => {
    const reviewer = { id: 'reviewer-1', nationalId: '1201743399' }
    const request: Record<string, unknown> = {
      user: createUser('1201743399'),
    }

    authorizationService.resolveAdminUser.mockResolvedValue(reviewer)

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.adminUser).toBe(reviewer)
    expect(authorizationService.resolveAdminUser).toHaveBeenCalledWith(
      '1201743399',
    )
  })

  it('throws ForbiddenException when user is not in doe_user', async () => {
    const request: Record<string, unknown> = {
      user: createUser('9999999999'),
    }

    authorizationService.resolveAdminUser.mockRejectedValue(
      new ForbiddenException('Access restricted to DoE reviewers'),
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(request.adminUser).toBeUndefined()
  })

  it('throws ForbiddenException when user is inactive', async () => {
    const request: Record<string, unknown> = {
      user: createUser('1201743399'),
    }

    authorizationService.resolveAdminUser.mockRejectedValue(
      new ForbiddenException('Access restricted to DoE reviewers'),
    )

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('refuses a token issued to another IDS client before looking up the reviewer', async () => {
    const request: Record<string, unknown> = {
      user: { ...createUser('0000000000'), aud: 'some-other-client' },
    }

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(authorizationService.resolveAdminUser).not.toHaveBeenCalled()
  })

  it('refuses a delegated session acting for a reviewer', async () => {
    const request: Record<string, unknown> = {
      user: {
        ...createUser('0000000000'),
        actor: { nationalId: '1111111111', name: 'Delegate', scope: [] },
      },
    }

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(authorizationService.resolveAdminUser).not.toHaveBeenCalled()
    expect(request.adminUser).toBeUndefined()
  })
})
