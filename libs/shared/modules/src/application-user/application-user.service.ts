import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, LogMethod, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUserInvolvedPartiesResponse,
  ApplicationUserQuery,
  CreateApplicationUser,
  GetApplicationUser,
  GetApplicationUsers,
  UpdateApplicationUser,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { applicationUserMigrate } from './migrations/application-user.migrate'
import { IApplicationUserService } from './application-user.service.interface'
import {
  ApplicationUserInvolvedPartyModel,
  ApplicationUserModel,
} from './models'

const LOGGING_CATEGORY = 'application-user-service'
const LOGGING_CONTEXT = 'ApplicationUserService'

@Injectable()
export class ApplicationUserService implements IApplicationUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationUserModel)
    private readonly applicationUserModel: typeof ApplicationUserModel,

    @InjectModel(ApplicationUserInvolvedPartyModel)
    private readonly userInvolvedPartyModel: typeof ApplicationUserInvolvedPartyModel,
    private readonly sequelize: Sequelize,
  ) {}

  async createUser(
    body: CreateApplicationUser,
  ): Promise<ResultWrapper<GetApplicationUser>> {
    const transaction = await this.sequelize.transaction()
    try {
      const userId = uuid()

      await this.applicationUserModel.create(
        {
          id: userId,
          nationalId: body.nationalId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
        },
        { transaction },
      )

      await this.userInvolvedPartyModel.bulkCreate(
        body.involvedPartyIds.map((party) => ({
          applicationUserId: userId,
          involvedPartyId: party,
        })),
        { transaction },
      )

      const user = await this.applicationUserModel.findByPk(userId, {
        include: [AdvertInvolvedPartyModel],
        transaction,
      })

      if (!user) {
        this.logger.error('Error creating user', {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        await transaction.rollback()
        return ResultWrapper.err({
          code: 500,
          message: 'Error creating user',
        })
      }

      const migrated = applicationUserMigrate(user)

      await transaction.commit()
      return ResultWrapper.ok({ user: migrated })
    } catch (error) {
      await transaction.rollback()
      this.logger.error('Error creating user', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Error creating user',
      })
    }
  }
  async updateUser(
    id: string,
    body: UpdateApplicationUser,
  ): Promise<ResultWrapper<GetApplicationUser>> {
    const transaction = await this.sequelize.transaction()
    try {
      const user = await this.applicationUserModel.findByPk(id, {
        transaction,
      })

      if (!user) {
        await transaction.rollback()
        return ResultWrapper.err({
          code: 404,
          message: 'User not found',
        })
      }

      await user.update(
        {
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
        },
        { transaction },
      )

      if (body.involvedPartyIds && body.involvedPartyIds?.length > 0) {
        await this.userInvolvedPartyModel.destroy({
          where: {
            applicationUserId: id,
          },
          transaction,
        })

        await this.userInvolvedPartyModel.bulkCreate(
          body.involvedPartyIds.map((party) => ({
            applicationUserId: id,
            involvedPartyId: party,
          })),
          { transaction },
        )
      }

      const updatedUser = await this.applicationUserModel.findByPk(id, {
        include: [AdvertInvolvedPartyModel],
        transaction,
      })

      if (!updatedUser) {
        await transaction.rollback()
        this.logger.error('Error updating user', {
          category: LOGGING_CATEGORY,
          context: LOGGING_CONTEXT,
        })
        return ResultWrapper.err({
          code: 500,
          message: 'Error updating user',
        })
      }

      await transaction.commit()

      const migrated = applicationUserMigrate(updatedUser)
      return ResultWrapper.ok({ user: migrated })
    } catch (error) {
      await transaction.rollback()
      this.logger.error('Error updating user', {
        category: LOGGING_CATEGORY,
        context: LOGGING_CONTEXT,
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Error updating user',
      })
    }
  }
  async deleteUser(id: string): Promise<ResultWrapper> {
    const transaction = await this.sequelize.transaction()
    try {
      const user = await this.applicationUserModel.findByPk(id, {
        transaction,
      })

      if (!user) {
        await transaction.rollback()
        return ResultWrapper.err({
          code: 404,
          message: 'User not found',
        })
      }

      await Promise.all([
        await this.userInvolvedPartyModel.destroy({
          where: {
            applicationUserId: id,
          },
          transaction,
        }),
        await this.applicationUserModel.destroy({
          where: {
            id,
          },
          transaction,
        }),
      ])

      await transaction.commit()
      return ResultWrapper.ok()
    } catch (error) {
      await transaction.rollback()
      this.logger.error('Error deleting user', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        error,
      })
      return ResultWrapper.err({
        code: 500,
        message: 'Error deleting user',
      })
    }
  }

  @LogMethod()
  async getUsers(
    query: ApplicationUserQuery,
  ): Promise<ResultWrapper<GetApplicationUsers>> {
    const whereParams = {}

    if (query?.involvedParty) {
      Object.assign(whereParams, {
        id: query.involvedParty,
      })
    }

    const users = await this.applicationUserModel.findAll({
      include: [{ model: AdvertInvolvedPartyModel, where: whereParams }],
    })

    const mapped = users.map((user) => applicationUserMigrate(user))

    return ResultWrapper.ok({ users: mapped })
  }

  @LogAndHandle()
  @Transactional()
  async getUser(
    nationalId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationUser>> {
    const user = await this.applicationUserModel.findOne({
      where: {
        id: nationalId,
      },
      include: [AdvertInvolvedPartyModel],
      transaction: transaction,
    })

    if (!user) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    const migrated = applicationUserMigrate(user)

    return ResultWrapper.ok({ user: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async getUserByNationalId(
    nationalId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetApplicationUser>> {
    const user = await this.applicationUserModel.findOne({
      where: {
        nationalId: nationalId,
      },
      include: [AdvertInvolvedPartyModel],
      transaction: transaction,
    })

    if (!user) {
      return ResultWrapper.err({
        code: 404,
        message: 'User not found',
      })
    }

    const migrated = applicationUserMigrate(user)

    return ResultWrapper.ok({ user: migrated })
  }

  @LogAndHandle()
  @Transactional()
  async getUserInvolvedParties(
    id: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationUserInvolvedPartiesResponse>> {
    const parties = ResultWrapper.unwrap(await this.getUser(id, transaction))

    return ResultWrapper.ok({
      involvedParties: parties.user.involvedParties,
    })
  }

  @LogAndHandle()
  @Transactional()
  async checkIfUserHasInvolvedParty(
    id: string,
    institutionId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ hasInvolvedParty: boolean }>> {
    const userLookup = await this.getUser(id, transaction)

    if (!userLookup.result.ok) {
      return ResultWrapper.err({
        code: userLookup.result.error.code,
        message: userLookup.result.error.message,
      })
    }

    const hasInvolvedParty = userLookup.result.value.user.involvedParties.some(
      (party) => party.id === institutionId,
    )

    return ResultWrapper.ok({ hasInvolvedParty })
  }
}
