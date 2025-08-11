import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { Auth } from '@island.is/auth-nest-tools'

import { CaseModel } from '../case/case.model'
import { CaseDto } from '../case/dto/case.dto'
import { BankruptcyApplicationModel } from './bankruptcy/models/bankruptcy-application.model'
import { ApplicationsDto } from './dto/application.dto'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
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

  @Post('createBankruptcyCaseAndApplication')
  @LGResponse({
    operationId: 'createBankruptcyCaseAndApplication',
    type: CaseDto,
  })
  async createBankruptcyCaseAndApplication(
    @CurrentUser() user: Auth,
  ): Promise<CaseDto> {
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    const results = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        bankruptcyApplication: {
          involvedPartyNationalId: user.nationalId,
        },
      },
      {
        include: [{ model: BankruptcyApplicationModel }],
        returning: true,
      },
    )

    return results.fromModel()
  }
}
