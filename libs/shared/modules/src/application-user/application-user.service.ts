import { decode } from 'jsonwebtoken'
import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUser,
  ApplicationUserInvolvedPartiesResponse,
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

  @LogAndHandle()
  @Transactional()
  async getUserFromToken(
    token: string | undefined,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ user: ApplicationUser }>> {
    let localToken = token
    if (localToken?.startsWith('Bearer ')) {
      localToken = localToken.slice(7)
    }

    if (!localToken) {
      this.logger.warn(
        `Tried to get user from token but no token was provided`,
        {
          category: LOGGING_CATEGORY,
        },
      )

      return ResultWrapper.err({
        code: 400,
        message: 'Invalid token',
      })
    }

    // TODO USE VERIFY LATER
    const tokenUser = decode(localToken)

    if (!tokenUser || typeof tokenUser === 'string') {
      this.logger.warn(`Tried to get user from token but token was invalid`, {
        category: LOGGING_CATEGORY,
      })

      return ResultWrapper.err({
        code: 400,
        message: 'Invalid token',
      })
    }

    if (!tokenUser?.nationalId) {
      this.logger.warn(
        `Tried to get user from token but no nationalId was found in token`,
        {
          category: LOGGING_CATEGORY,
        },
      )

      return ResultWrapper.err({
        code: 400,
        message: 'Invalid token',
      })
    }

    const userLookup = await this.getUser(tokenUser.nationalId, transaction)

    if (!userLookup.result.ok) {
      return userLookup
    }

    return ResultWrapper.ok({ user: userLookup.result.value.user })
  }

  @LogAndHandle()
  @Transactional()
  async getUser(
    nationalId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ user: ApplicationUser }>> {
    const user = await this.userModel.findOne({
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
}
