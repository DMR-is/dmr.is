import addDays from 'date-fns/addDays'

import {
  BadRequestException,
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
import { commonFormSchema } from '../../../../lib/schemas'
import { mapIndexToVersion } from '../../../../lib/utils'
import { AdvertModel } from '../../../advert/advert.model'
import { CaseModel } from '../../../case/case.model'
import { CaseDto } from '../../../case/dto/case.dto'
import { TypeIdEnum } from '../../../type/type.model'
import { ApplicationStatusEnum } from '../../contants'
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

    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
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

  @Post(':caseId/:applicationId/submit')
  @LGResponse({ operationId: 'submitCommonApplication' })
  async submitCommonApplication(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
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

    const form = commonFormSchema.safeParse({
      categoryId: application.categoryId,
      caption: application.caption,
      html: application.html,
      signatureDate: application.signatureDate,
      signatureLocation: application.signatureLocation,
      signatureName: application.signatureName,
      publishingDates: application.publishingDates,
    })

    if (!form.success) {
      throw new BadRequestException('Application data is invalid')
    }

    const submittedBy = `${user.name}${user.actor ? ` (${user.actor.name})` : ''}`

    await this.advertModel.bulkCreate(
      form.data.publishingDates.map((date, i) => ({
        categoryId: form.data.categoryId,
        scheduledAt: date,
        submittedBy: submittedBy,
        title: form.data.caption,
        html: form.data.html,
        typeId: TypeIdEnum.COMMON_ADVERT,
        caseId: caseId,
        paid: false,
        version: mapIndexToVersion(i),
        commonAdvert: {
          signatureDate: form.data.signatureDate,
          signatureLocation: form.data.signatureLocation,
          signatureName: form.data.signatureName,
          caption: form.data.caption,
        },
      })),
    )

    await application.update({
      status: ApplicationStatusEnum.SUBMITTED,
    })
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
