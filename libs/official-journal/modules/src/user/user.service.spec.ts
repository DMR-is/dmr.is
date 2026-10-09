/* eslint-disable simple-import-sort/imports */
// Load the advert-type models before the journal barrel, which otherwise
// reads AdvertDepartmentModel before it is initialised (cyclic models).
// Import sorting would move this side-effect import last, hence the disable.
import '../advert-type/models'

import { UserRoleEnum } from '@dmr.is/constants'
import { UpdateUserDto, UserDto } from '@dmr.is/shared-dto'

import type { AdvertInvolvedPartyModel } from '../journal/models'
import type { UserModel } from './models/user.model'
import type { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import type { UserRoleModel } from './models/user-role.model'
import { UserService } from './user.service'

const ROLES = {
  admin: { id: 'role-admin', title: UserRoleEnum.Admin },
  editor: { id: 'role-editor', title: UserRoleEnum.Editor },
  user: { id: 'role-user', title: UserRoleEnum.User },
}

type Party = string | { id: string }

describe('UserService authorization', () => {
  let users: Record<string, unknown>
  let userModel: {
    findByPk: jest.Mock
    destroy: jest.Mock
  }
  let userInvolvedPartiesModel: { destroy: jest.Mock; bulkCreate: jest.Mock }
  let service: UserService

  const dbUser = (
    id: string,
    role: { id: string; title: UserRoleEnum },
    parties: string[],
  ) => ({
    id,
    nationalId: '0000000000',
    firstName: 'A',
    lastName: 'B',
    displayName: 'A B',
    email: 'a@b.is',
    role,
    involvedParties: parties.map((partyId) => ({ id: partyId })),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    update: jest.fn(),
  })

  // As RoleGuard leaves it: involvedParties are id strings
  const caller = (
    role: { id: string; title: UserRoleEnum },
    parties: Party[],
  ): UserDto => ({ id: 'caller', role, involvedParties: parties }) as never

  beforeEach(() => {
    users = {}
    userModel = {
      findByPk: jest.fn((id: string) => Promise.resolve(users[id] ?? null)),
      destroy: jest.fn(),
    }
    userInvolvedPartiesModel = {
      destroy: jest.fn(),
      bulkCreate: jest.fn(),
    }
    const userRoleModel = {
      findByPk: jest.fn((id: string) =>
        Promise.resolve(
          Object.values(ROLES).find((role) => role.id === id) ?? null,
        ),
      ),
    }
    const logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() }
    const sequelize = {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      }),
    }

    service = new UserService(
      logger as never,
      userModel as unknown as typeof UserModel,
      userRoleModel as unknown as typeof UserRoleModel,
      {} as typeof AdvertInvolvedPartyModel,
      userInvolvedPartiesModel as unknown as typeof UserInvolvedPartiesModel,
      sequelize as never,
    )
  })

  const update = (target: string, body: Partial<UpdateUserDto>, by: UserDto) =>
    service.updateUser(target, body as UpdateUserDto, by)

  describe('updateUser by an editor', () => {
    const editor = () => caller(ROLES.editor, ['party-a'])

    it('may update an editor in its own party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update('target', { firstName: 'X' }, editor())
      expect(result.result.ok).toBe(true)
    })

    it('may not hand out the admin role', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update(
        'target',
        { roleId: ROLES.admin.id },
        editor(),
      )
      expect(result.result.ok).toBe(false)
      expect(
        (users.target as { update: jest.Mock }).update,
      ).not.toHaveBeenCalled()
    })

    it('may not set an unknown role', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update('target', { roleId: 'role-x' }, editor())
      expect(result.result.ok).toBe(false)
    })

    it('may not update an admin account', async () => {
      users.target = dbUser('target', ROLES.admin, [])
      const result = await update('target', { firstName: 'X' }, editor())
      expect(result.result.ok).toBe(false)
    })

    it('may not update an account with no parties', async () => {
      users.target = dbUser('target', ROLES.editor, [])
      const result = await update('target', { firstName: 'X' }, editor())
      expect(result.result.ok).toBe(false)
    })

    it('may not update an editor of another party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-b'])
      const result = await update('target', { firstName: 'X' }, editor())
      expect(result.result.ok).toBe(false)
    })

    it('may not assign a party it does not belong to', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await update(
        'target',
        { involvedParties: ['party-a', 'party-b'] },
        editor(),
      )
      expect(result.result.ok).toBe(false)
      expect(userInvolvedPartiesModel.bulkCreate).not.toHaveBeenCalled()
    })
  })

  it('lets an admin hand out the admin role', async () => {
    users.target = dbUser('target', ROLES.editor, [])
    const result = await update(
      'target',
      { roleId: ROLES.admin.id },
      caller(ROLES.admin, []),
    )
    expect(result.result.ok).toBe(true)
  })

  describe('deleteUser by an editor', () => {
    it('may not delete an admin sharing its party', async () => {
      users.target = dbUser('target', ROLES.admin, ['party-a'])
      const result = await service.deleteUser(
        'target',
        caller(ROLES.editor, ['party-a']),
      )
      expect(result.result.ok).toBe(false)
      expect(userModel.destroy).not.toHaveBeenCalled()
    })

    it('may delete an editor sharing its party', async () => {
      users.target = dbUser('target', ROLES.editor, ['party-a'])
      const result = await service.deleteUser(
        'target',
        caller(ROLES.editor, ['party-a']),
      )
      expect(result.result.ok).toBe(true)
    })
  })
})
