import { isPersonKennitala, isValid as isValidKennitala } from 'kennitala'
import { Op } from 'sequelize'

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { INationalRegistryService } from '@dmr.is/clients-national-registry'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CreateUserBodyDto } from './dto/create-user.body.dto'
import { GetUsersQueryDto } from './dto/get-users.query.dto'
import { UpdateUserBodyDto } from './dto/update-user.body.dto'
import { UserDto } from './dto/user.dto'
import { UserLookupDto } from './dto/user-lookup.dto'
import { UserModel } from './models/user.model'
import { DoeUserRole } from './types/user-role'
import { userMessages } from './user.messages'
import { IUserService } from './user.service.interface'

const LOGGING_CONTEXT = 'UserService'

/**
 * The registry's one full name, split at its last space: "Jón Bjarni
 * Ólafsson" → "Jón Bjarni" / "Ólafsson". A single word is all first name, with
 * an empty last name for the admin to fill in.
 */
export const splitRegistryName = (
  fullName: string,
): { firstName: string; lastName: string } => {
  const words = fullName.trim().split(/\s+/).filter(Boolean)

  if (words.length <= 1) {
    return { firstName: words[0] ?? '', lastName: '' }
  }

  return {
    firstName: words.slice(0, -1).join(' '),
    lastName: words[words.length - 1],
  }
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(UserModel) private readonly userModel: typeof UserModel,
    @Inject(INationalRegistryService)
    private readonly nationalRegistryService: INationalRegistryService,
  ) {}

  async getMyUser(nationalId: string): Promise<UserDto> {
    this.logger.debug(`Getting user with national ID ${nationalId}`, {
      context: LOGGING_CONTEXT,
    })

    const user = await this.userModel.findOneOrThrow({
      where: { nationalId },
    })

    return user.fromModel()
  }

  async getUsers({ showInactive }: GetUsersQueryDto): Promise<UserDto[]> {
    this.logger.debug(
      `Listing users${showInactive ? ' (including inactive)' : ''}`,
      { context: LOGGING_CONTEXT },
    )

    const users = await this.userModel.findAll({
      where: showInactive ? undefined : { isActive: true },
      order: [
        ['firstName', 'ASC'],
        ['lastName', 'ASC'],
      ],
    })

    return users.map((user) => user.fromModel())
  }

  async lookupNationalRegistry(nationalId: string): Promise<UserLookupDto> {
    this.logger.debug(
      `Looking up person in national registry by national id "${nationalId}"`,
      { context: LOGGING_CONTEXT },
    )

    // Checked first, and on its own. The route's pipe accepts any ten digits,
    // and `isPersonKennitala` below also fails on a bad checksum — so without
    // this a mistyped kennitala would be reported as a company's.
    if (!isValidKennitala(nationalId)) {
      throw new BadRequestException(userMessages.invalidKennitala())
    }

    // Users are people signing in with their own rafræn skilríki. A company's
    // kennitala could never sign in as one, so refuse it here rather than
    // pre-fill a user from a company name.
    if (!isPersonKennitala(nationalId)) {
      throw new BadRequestException(userMessages.notAPerson())
    }

    // Our own table first. An existing user cannot be created again, so the
    // registry's copy of their details would be fetched only to be discarded —
    // and a user the registry no longer lists would read as "not found"
    // instead of "already a user".
    const existing = await this.userModel.findOne({ where: { nationalId } })

    if (existing) {
      return {
        nationalId,
        name: `${existing.firstName} ${existing.lastName}`.trim(),
        firstName: existing.firstName,
        lastName: existing.lastName,
        alreadyUser: true,
      }
    }

    const result =
      await this.nationalRegistryService.getEntityByNationalId(nationalId)

    if (!result.entity) {
      throw new NotFoundException(
        userMessages.registryPersonNotFound(nationalId),
      )
    }

    // The validated input, not the registry's echo of it: the web matches the
    // response against what was typed, and a formatting difference in the
    // registry's copy would leave the form locked with no error.
    return {
      nationalId,
      name: result.entity.nafn,
      ...splitRegistryName(result.entity.nafn),
      alreadyUser: false,
    }
  }

  async createUser(input: CreateUserBodyDto): Promise<UserDto> {
    this.logger.info(`Creating user with national ID ${input.nationalId}`, {
      context: LOGGING_CONTEXT,
    })

    const conflict = await this.userModel.findOne({
      where: {
        [Op.or]: [{ nationalId: input.nationalId }, { email: input.email }],
      },
    })

    if (conflict) {
      const field =
        conflict.nationalId === input.nationalId ? 'national ID' : 'email'
      throw new ConflictException(`User with this ${field} already exists`)
    }

    const user = await this.userModel.create({
      nationalId: input.nationalId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
    })

    return user.fromModel()
  }

  async updateUser(
    id: string,
    input: UpdateUserBodyDto,
    actorId: string,
  ): Promise<UserDto> {
    this.logger.info(`Updating user ${id}`, { context: LOGGING_CONTEXT })

    const user = await this.userModel.findByPkOrThrow(id)

    const willDemote = input.role === DoeUserRole.EDITOR
    const willDeactivate = input.isActive === false

    if (actorId === id && (willDemote || willDeactivate)) {
      throw new BadRequestException(
        'You cannot demote or deactivate your own account',
      )
    }

    const wasAdminAndActive =
      user.role === DoeUserRole.ADMIN && user.isActive === true
    const losingAdmin = wasAdminAndActive && (willDemote || willDeactivate)

    if (losingAdmin) {
      const otherActiveAdmins = await this.userModel.count({
        where: {
          role: DoeUserRole.ADMIN,
          isActive: true,
          id: { [Op.ne]: id },
        },
      })

      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'Cannot demote or deactivate the last active admin',
        )
      }
    }

    if (input.email !== undefined && input.email !== user.email) {
      const conflict = await this.userModel.findOne({
        where: { email: input.email, id: { [Op.ne]: id } },
      })
      if (conflict) {
        throw new ConflictException('User with this email already exists')
      }
    }

    if (input.firstName !== undefined) user.firstName = input.firstName
    if (input.lastName !== undefined) user.lastName = input.lastName
    if (input.email !== undefined) user.email = input.email
    if (input.phone !== undefined) user.phone = input.phone
    if (input.isActive !== undefined) user.isActive = input.isActive
    if (input.role !== undefined) user.role = input.role

    await user.save()

    return user.fromModel()
  }

  async softDeleteUser(id: string, actorId: string): Promise<void> {
    this.logger.info(`Soft-deleting user ${id}`, { context: LOGGING_CONTEXT })

    if (actorId === id) {
      throw new BadRequestException('You cannot deactivate your own account')
    }

    const user = await this.userModel.findByPkOrThrow(id)

    if (!user.isActive) {
      return
    }

    if (user.role === DoeUserRole.ADMIN) {
      const otherActiveAdmins = await this.userModel.count({
        where: {
          role: DoeUserRole.ADMIN,
          isActive: true,
          id: { [Op.ne]: id },
        },
      })

      if (otherActiveAdmins === 0) {
        throw new BadRequestException('Cannot deactivate the last active admin')
      }
    }

    user.isActive = false
    await user.save()
  }
}
