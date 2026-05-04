import { ForbiddenException } from '@nestjs/common'

import { type DMRUser } from '@dmr.is/island-auth-nest/dmrUser'

import { AdminGuard } from './admin.guard'

const createUser = (nationalId: string): DMRUser =>
  ({
    nationalId,
    name: 'Test User',
    fullName: 'Test User',
    scope: [],
    client: 'test',
    authorization: 'Bearer test',
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

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new AdminGuard(authorizationService as never)
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
})
