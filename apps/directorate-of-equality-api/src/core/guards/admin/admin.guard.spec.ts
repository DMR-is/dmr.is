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
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }

  const userModel = {
    findOne: jest.fn(),
  }

  let guard: AdminGuard

  beforeEach(() => {
    jest.clearAllMocks()
    guard = new AdminGuard(logger as never, userModel as never)
  })

  it('allows an active reviewer and attaches adminUser to the request', async () => {
    const reviewer = { id: 'reviewer-1', nationalId: '1201743399' }
    const request: Record<string, unknown> = {
      user: createUser('1201743399'),
    }

    userModel.findOne.mockResolvedValue(reviewer)

    const allowed = await guard.canActivate(createExecutionContext(request))

    expect(allowed).toBe(true)
    expect(request.adminUser).toBe(reviewer)
    expect(userModel.findOne).toHaveBeenCalledWith({
      where: { nationalId: '1201743399', isActive: true },
    })
  })

  it('throws ForbiddenException when user is not in doe_user', async () => {
    const request: Record<string, unknown> = {
      user: createUser('9999999999'),
    }

    userModel.findOne.mockResolvedValue(null)

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)

    expect(request.adminUser).toBeUndefined()
  })

  it('throws ForbiddenException when user is inactive', async () => {
    const request: Record<string, unknown> = {
      user: createUser('1201743399'),
    }

    userModel.findOne.mockResolvedValue(null)

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })
})
