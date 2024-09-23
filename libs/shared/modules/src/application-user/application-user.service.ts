import { LogAndHandle } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { ResultWrapper } from '@dmr.is/types'

import { Inject, Injectable } from '@nestjs/common'

import { IUserService } from './application-user.service.interface'

@Injectable()
export class UserService implements IUserService {
  constructor(@Inject(LOGGER_PROVIDER) private readonly logger: Logger) {}

  @LogAndHandle()
  async getUser(id: string): Promise<ResultWrapper> {
    return ResultWrapper.ok()
  }
}
