import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CanActivate, ExecutionContext, Inject } from '@nestjs/common'

import { IUtilityService } from '../utility/utility.service.interface'

export class InvolvedPartyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IUtilityService) private readonly utilityService: IUtilityService,
  ) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest()

      const involvedPartyIds = request.involvedParties

      const applicationId = request.params.id

      const caseInvolvedPartyResult =
        await this.utilityService.getCaseInvolvedPartyByApplicationId(
          applicationId,
        )

      if (!caseInvolvedPartyResult.result.ok) {
        this.logger.warn('Case not found for user', {
          context: 'InvolvedPartyGuard',
          category: 'involved-party-guard',
          applicationId: applicationId,
          userInvolvedParties: involvedPartyIds,
        })
        return false
      }

      const caseInvoledPartyId =
        caseInvolvedPartyResult.result.value.involvedPartyId

      if (involvedPartyIds?.includes(caseInvoledPartyId)) {
        return true
      }

      this.logger.warn(`No matching involed parties found`, {
        context: 'InvolvedPartyGuard',
        category: 'involved-party-guard',
        applicationId: applicationId,
        userInvolvedParties: involvedPartyIds,
        caseInvolvedParty: caseInvoledPartyId,
      })
      return false
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
