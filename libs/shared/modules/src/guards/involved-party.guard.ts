import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { CanActivate, ExecutionContext, Inject } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { CaseModel } from '../case/models'

export class InvolvedPartyGuard implements CanActivate {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}
  async canActivate(context: ExecutionContext) {
    try {
      const request = context.switchToHttp().getRequest()

      const involvedPartyIds = request.involvedParties

      const applicationId = request.params.id

      const theCase = await this.caseModel.findOne({
        attributes: ['involvedPartyId'],
        where: {
          applicationId: applicationId,
        },
      })

      if (involvedPartyIds?.includes(theCase?.involvedPartyId)) {
        return true
      }

      this.logger.warn(
        theCase
          ? `No matching involed parties found`
          : `Case not found for user `,
        {
          context: 'InvolvedPartyGuard',
          category: 'involved-party-guard',
          applicationId: applicationId,
          userInvolvedParties: involvedPartyIds,
          caseInvolvedParty: theCase?.involvedPartyId,
        },
      )
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
