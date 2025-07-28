import { Op } from 'sequelize'

import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { LGResponse } from '@dmr.is/legal-gazette/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { Auth } from '@island.is/auth-nest-tools'

import { CaseModel } from '../../case/case.model'
import { BankruptcyApplicationDto } from './dto/bankruptcy-application.dto'
import { UpdateBankruptcyApplicationDto } from './dto/update-bankruptcy-application.dto'
import { BankruptcyApplicationModel } from './models/bankruptcy-application.model'

@Controller({
  version: '1',
  path: 'applications/bankruptcy',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class BankruptcyApplicationController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(BankruptcyApplicationModel)
    private readonly bankruptcyApplicationModel: typeof BankruptcyApplicationModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  @Post(':caseId')
  @LGResponse({
    operationId: 'findOrCreateApplication',
    type: BankruptcyApplicationDto,
  })
  async findOrCreate(
    @Param('caseId') caseId: string,
    @CurrentUser() user: Auth,
  ) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to create draft advert', {
        context: 'BankruptcyApplicationController',
      })

      throw new UnauthorizedException('User not authenticated')
    }

    const caseExists = await this.caseModel
      .unscoped()
      .findByPk(caseId, { attributes: ['id'] })

    if (!caseExists) {
      throw new NotFoundException('Case not found')
    }

    const [model, _created] =
      await this.bankruptcyApplicationModel.findOrCreate({
        where: { caseId, involvedPartyNationalId: user.nationalId },
      })

    return model.fromModel()
  }

  @Patch(':caseId/:applicationId')
  @LGResponse({ operationId: 'updateBankruptcyApplication', status: 200 })
  async update(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: Auth,
    @Body() body: UpdateBankruptcyApplicationDto,
  ) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to update draft advert', {
        context: 'BankruptcyApplicationController',
      })

      throw new UnauthorizedException('User not authenticated')
    }

    await this.bankruptcyApplicationModel.updateFromDto(
      caseId,
      applicationId,
      body,
    )
  }
}
