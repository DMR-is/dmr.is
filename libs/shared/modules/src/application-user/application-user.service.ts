import { decode } from 'jsonwebtoken'
import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, LogMethod, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUserInvolvedPartiesResponse,
  ApplicationUserQuery,
  GetApplicationUser,
  GetApplicationUsers,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { applicationUserMigrate } from './migrations/application-user.migrate'
import { IApplicationUserService } from './application-user.service.interface'
import { ApplicationUserModel } from './models'

const LOGGING_CATEGORY = 'application-user-service'

@Injectable()
export class ApplicationUserService implements IApplicationUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationUserModel)
    private readonly userModel: typeof ApplicationUserModel,
    private readonly sequelize: Sequelize,
  ) {}

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

    const users = await this.userModel.findAll({
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
    const user = await this.userModel.findOne({
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
  async getUserInvolvedParties(
    nationalId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<ApplicationUserInvolvedPartiesResponse>> {
    const parties = ResultWrapper.unwrap(
      await this.getUser(nationalId, transaction),
    )

    return ResultWrapper.ok({
      involvedParties: parties.user.involvedParties,
    })
  }

  @LogAndHandle()
  @Transactional()
  async checkIfUserHasInvolvedParty(
    nationalId: string,
    institutionId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ hasInvolvedParty: boolean }>> {
    const userLookup = await this.getUser(nationalId, transaction)

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
