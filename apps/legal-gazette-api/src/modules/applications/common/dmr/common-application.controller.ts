import addDays from 'date-fns/addDays'

import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { ApiBearerAuth } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { TokenJwtAuthGuard } from '@dmr.is/modules'

import { LGResponse } from '../../../../decorators/lg-response.decorator'
import { CaseModel } from '../../../case/case.model'
import { CaseDto } from '../../../case/dto/case.dto'
import { CommonApplicationDto } from './dto/common-application.dto'
import { UpdateCommonApplicationDto } from './dto/update-common-application.dto'
import { CommonApplicationModel } from './common-application.model'

@Controller({
  path: 'applications/common',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class CommonApplicationController {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(CommonApplicationModel)
    private readonly commonApplicationModel: typeof CommonApplicationModel,
  ) {}

  @Post('createCommonCaseAndApplication')
  @LGResponse({ operationId: 'createCommonCaseAndApplication', type: CaseDto })
  async createCommonCaseAndApplication(@CurrentUser() user: DMRUser) {
    const caseModel = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        commonApplication: {
          involvedPartyNationalId: user.nationalId,
          publishingDates: [addDays(new Date(), 14)],
        },
      },
      {
        include: [CommonApplicationModel],
      },
    )

    return caseModel.fromModel()
  }

  @Get(':caseId')
  @LGResponse({
    operationId: 'getCommonApplicationByCaseId',
    type: CommonApplicationDto,
  })
  async getCommonApplication(
    @Param('caseId') caseId: string,
    @CurrentUser() user: DMRUser,
  ) {
    const application = await this.commonApplicationModel.findOne({
      where: { caseId: caseId, involvedPartyNationalId: user.nationalId },
    })

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    return application.fromModel()
  }

  @Patch(':caseId/:applicationId')
  @LGResponse({
    operationId: 'updateCommonApplication',
    type: CommonApplicationDto,
  })
  async updateCommonApplication(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
    @Body() updateCommonApplicationDto: UpdateCommonApplicationDto,
  ) {
    const application = await this.commonApplicationModel.findOne({
      where: {
        id: applicationId,
        caseId: caseId,
        involvedPartyNationalId: user.nationalId,
      },
    })

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    const signatureDate =
      typeof updateCommonApplicationDto.signatureDate === 'string'
        ? new Date(updateCommonApplicationDto.signatureDate)
        : updateCommonApplicationDto.signatureDate

    await application.update({
      categoryId: updateCommonApplicationDto.categoryId,
      caption: updateCommonApplicationDto.caption,
      html: updateCommonApplicationDto.html,
      signatureDate: signatureDate,
      involvedPartyNationalId: user.nationalId,
      signatureLocation: updateCommonApplicationDto.signatureLocation,
      signatureName: updateCommonApplicationDto.signatureName,
      publishingDates: updateCommonApplicationDto.publishingDates?.map(
        (d) => new Date(d),
      ),
    })

    return application.fromModel()
  }
}
