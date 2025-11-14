import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common'

import { INationalRegistryService } from '@dmr.is/clients/national-registry'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

@Injectable()
export class CurrentNationalRegistryPersonGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(INationalRegistryService)
    private readonly nationalRegistryService: INationalRegistryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest()

      const nationalId = request.user?.nationalId

      if (!nationalId) {
        return false
      }

      const person =
        await this.nationalRegistryService.getPersonByNationalId(nationalId)

      request.person = person

      return true
    } catch (error: unknown) {
      this.logger.error('Error in CurrentNationalRegistryPersonGuard', {
        context: 'CurrentNationalRegistryPersonGuard',
        error: error,
      })
      return false
    }
  }
}
