import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common'

import { PersonDto } from '@dmr.is/clients/national-registry'
import { logger } from '@dmr.is/logging'

/**
 * Get the national registry person of the current user
 */

export const CurrentSubmittee = createParamDecorator(
  async (data: unknown, ctx: ExecutionContext): Promise<PersonDto> => {
    const request = ctx.switchToHttp().getRequest()

    if (!request.person) {
      logger.error('Current user not found in national registry')
      throw new InternalServerErrorException(
        'Current user not found in national registry',
      )
    }

    return request.person.person
  },
)
