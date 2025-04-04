import { UserRoleEnum } from '@dmr.is/constants'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { UserDto } from '@dmr.is/official-journal/dto/user/user.dto'
import { ICaseService } from '@dmr.is/official-journal/modules/case'

import { CanActivate, ExecutionContext, Inject } from '@nestjs/common'

export class InvolvedPartyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest()

      const user = request.user as UserDto | undefined
      if (!user) {
        this.logger.warn('User not found in request', {
          context: 'InvolvedPartyGuard',
          category: 'involved-party-guard',
        })
        return false
      }

      const isAdmin = request.user.role.title === UserRoleEnum.Admin

      if (isAdmin) {
        return true
      }

      const involvedPartyIds = user.involvedParties.map(
        (involvedParty) => involvedParty.id,
      )

      if (!involvedPartyIds || involvedPartyIds.length === 0) {
        this.logger.warn('No involved parties found', {
          context: 'InvolvedPartyGuard',
          category: 'involved-party-guard',
          applicationId: request.params.id,
        })
        return false
      }

      const applicationId = request.params.id

      const caseInvolvedPartyResult = await this.caseService.getCases({
        applicationId: applicationId,
        page: 1,
        pageSize: 1,
        sortBy: 'createdAt',
        direction: 'DESC',
      })

      if (!caseInvolvedPartyResult || !caseInvolvedPartyResult.result.ok) {
        this.logger.warn('Case not found for user', {
          context: 'InvolvedPartyGuard',
          category: 'involved-party-guard',
          applicationId: applicationId,
          userInvolvedParties: involvedPartyIds,
        })
        return false
      }

      const hasAccess = caseInvolvedPartyResult.result.value.cases.some((cs) =>
        involvedPartyIds.includes(cs.involvedParty.id),
      )

      return hasAccess
    } catch (error) {
      this.logger.error('Error in InvolvedPartyGuard', {
        error,
        context: 'InvolvedPartyGuard',
        category: 'involved-party-guard',
      })

      return false
    }
  }
}
