import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  ApplicationUser,
  ApplicationUserInvolvedPartiesResponse,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { applicationUserMigrate } from './migrations/application-user.migrate'
import { IApplicationUserService } from './application-user.service.interface'
import { ApplicationUserModel } from './models'

@Injectable()
export class ApplicationUserService implements IApplicationUserService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(ApplicationUserModel)
    private readonly userModel: typeof ApplicationUserModel,
    private readonly sequelize: Sequelize,
  ) {}
  async getUserInvolvedParties(
    nationalId: string,
  ): Promise<ResultWrapper<ApplicationUserInvolvedPartiesResponse>> {
    const parties = ResultWrapper.unwrap(await this.getUser(nationalId))

    return ResultWrapper.ok({
      involvedParties: parties.user.involvedParties,
    })
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
      throw new NotFoundException(`User not found`)
    }

    const migrated = applicationUserMigrate(user)

    return ResultWrapper.ok({ user: migrated })
  }
}
