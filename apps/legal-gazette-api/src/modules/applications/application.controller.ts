import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { Auth } from '@island.is/auth-nest-tools'

import { CaseModel } from '../case/case.model'
import { BankruptcyApplicationModel } from './bankruptcy/models/bankruptcy-application.model'
import { ApplicationsDto } from './dto/application.dto'

@ApiBearerAuth()
@Controller({
  path: 'applications',
  version: '1',
})
export class ApplicationController {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(BankruptcyApplicationModel)
    private readonly bankruptcyApplicationModel: typeof BankruptcyApplicationModel,
  ) {}

  @Get('getMyApplications')
  @LGResponse({ operationId: 'getMyApplications', type: ApplicationsDto })
  async getMyApplications(@CurrentUser() user: Auth): Promise<ApplicationsDto> {
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    const bankruptcyApplications =
      await this.bankruptcyApplicationModel.findAll({
        where: {
          involvedPartyNationalId: user.nationalId,
        },
      })

    // TODO: add deceased applications here

    const mapped = bankruptcyApplications.map((model) =>
      model.fromModelToApplicationDto(),
    )

    return { applications: mapped }
  }

  @Delete(':applicationId')
  @LGResponse({ operationId: 'deleteApplication' })
  async deleteApplication(
    @CurrentUser() user: Auth,
    @Param('applicationId') applicationId: string,
  ): Promise<void> {
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    const application = await this.bankruptcyApplicationModel
      .unscoped()
      .findOne({
        where: {
          id: applicationId,
          involvedPartyNationalId: user.nationalId,
        },
      })

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    await application.deleteApplication()
  }
}
