import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { AdvertModel } from '../modules/advert/advert.model'
import { StatusIdEnum } from '../modules/status/status.model'

const LOGGIN_CONTEXT = 'AdvertUpdateGuard'
const LOGGING_CATEGORY = 'advert-update-guard'

@Injectable()
export class AdvertUpdateGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    const allowedStatuses = [
      StatusIdEnum.SUBMITTED,
      StatusIdEnum.READY_FOR_PUBLICATION,
    ]

    const advertId = request.params.id || request.params.advertId

    if (!advertId) {
      this.logger.warn('Advert id is missing for update', {
        context: LOGGIN_CONTEXT,
        category: LOGGING_CATEGORY,
      })
      return false
    }

    const advert = await this.advertModel
      .unscoped()
      .findByPk(advertId, { attributes: ['statusId'] })

    if (!advert) {
      this.logger.warn(`Advert with id ${advertId} not found`, {
        context: LOGGIN_CONTEXT,
        category: LOGGING_CATEGORY,
      })

      return false
    }

    if (allowedStatuses.includes(advert.statusId)) {
      return true
    }

    this.logger.warn(
      `Advert with id ${advertId} is not in an updatable status`,
      {
        context: LOGGIN_CONTEXT,
        category: LOGGING_CATEGORY,
        advertId,
        statusId: advert.statusId,
      },
    )

    return false
  }
}
