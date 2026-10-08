import { ExecutionContext, InternalServerErrorException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { type Logger } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { IUserService } from '../../user/user.service.interface'
import { RoleGuard } from './role-guard'

const createContext = (nationalId = '0101302399') =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user: { nationalId } }) }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  }) as unknown as ExecutionContext

describe('RoleGuard', () => {
  const getUserByNationalId = jest.fn()
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as unknown as Logger
  const reflector = {
    get: jest.fn(() => ['Ritstjóri']),
  } as unknown as Reflector

  const guard = new RoleGuard(reflector, logger, {
    getUserByNationalId,
  } as unknown as IUserService)

  afterEach(() => jest.clearAllMocks())

  it('allows a user with a required role', async () => {
    getUserByNationalId.mockResolvedValue(
      ResultWrapper.ok({
        user: { role: { title: 'Ritstjóri' }, involvedParties: [] },
      }),
    )

    await expect(guard.canActivate(createContext())).resolves.toBe(true)
  })

  it('refuses a user without a required role', async () => {
    getUserByNationalId.mockResolvedValue(
      ResultWrapper.ok({
        user: { role: { title: 'Fulltrúi' }, involvedParties: [] },
      }),
    )

    await expect(guard.canActivate(createContext())).resolves.toBe(false)
  })

  it('refuses an unknown user (404 from the lookup)', async () => {
    getUserByNationalId.mockResolvedValue(
      ResultWrapper.err({ code: 404, message: 'User not found' }),
    )

    await expect(guard.canActivate(createContext())).resolves.toBe(false)
  })

  it('throws a 500, not a refusal, when the lookup fails', async () => {
    getUserByNationalId.mockResolvedValue(
      ResultWrapper.err({ code: 500, message: 'Database error' }),
    )

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      InternalServerErrorException,
    )
  })
})
