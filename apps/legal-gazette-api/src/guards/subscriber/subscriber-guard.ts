import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { ISubscriberService } from '../../modules/subscribers/subscriber.service.interface'
import { SUBSCRIPTION_KEY } from './subscriber.decorator'
import { Subscription } from './subscriber.enum'

@Injectable()
export class SubscriberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,

    @Inject(ISubscriberService)
    private readonly subscriberService: ISubscriberService,
  ) {}

  @LogMethod(false)
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()

    const requiredSubscriptions = this.reflector.getAllAndOverride<
      Subscription[]
    >(SUBSCRIPTION_KEY, [context.getHandler(), context.getClass()])
    if (!requiredSubscriptions) {
      return true
    }

    try {
      // Check if user has required roles
      const userLookup = await this.subscriberService.getUserByNationalId(
        req.user?.actor?.nationalId ?? req.user.nationalId,
      )

      const userRole = userLookup.role

      if (requiredSubscriptions.includes(userRole)) {
        return true
      }

      return false
    } catch (error) {
      this.logger.error('subscriberLookup Error:', error)
      throw new InternalServerErrorException('Subscriber lookup failed')
    }
  }
}
