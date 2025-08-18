import { isDefined } from 'class-validator'

import { Controller, Get, UseGuards } from '@nestjs/common'
import { isDefined } from 'class-validator'

import { Controller, Get, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { Auth } from '@island.is/auth-nest-tools'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { LGResponse } from '../../decorators/lg-response.decorator'
import { CaseModel } from '../case/case.model'
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
  ) {}

  @Get('getMyApplications')
  @LGResponse({ operationId: 'getMyApplications', type: ApplicationsDto })
  async getMyApplications(@CurrentUser() user: Auth): Promise<ApplicationsDto> {
    const cases = await this.caseModel
      .scope('applications')
      .findAll({ where: { involvedPartyNationalId: user.nationalId } })

    const applications = cases
      .map((caseModel) => {
        if (caseModel.recallApplication) {
          return caseModel.recallApplication.fromModelToApplicationDto()
        }
        if (caseModel.commonApplication) {
          return caseModel.commonApplication.fromModelToApplicationDto()
        }
      })
      .filter(isDefined)

    return { applications }
  }
}
