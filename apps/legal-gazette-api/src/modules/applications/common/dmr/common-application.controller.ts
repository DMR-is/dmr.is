import addDays from 'date-fns/addDays'

import { Controller, Post, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { CaseModel } from '../../../case/case.model'

@Controller({
  path: 'applications/common',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommonApplicationController {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
  ) {}

  @Post('createCommonCaseAndApplication')
  async createCommonCaseAndApplication(@CurrentUser() user: DMRUser) {
    await this.caseModel.create({
      involvedPartyNationalId: user.nationalId,
      commonApplication: {
        involvedPartyNationalId: user.nationalId,
        publishingDates: [addDays(new Date(), 14)],
      },
    })
  }
}
