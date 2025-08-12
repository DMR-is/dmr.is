import {
  Body,
  Controller,
  Get,
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
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { Auth } from '@island.is/auth-nest-tools'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { CaseModel } from '../../case/case.model'
import { CaseDto } from '../../case/dto/case.dto'
import { DeceasedApplicationDto } from './dto/deceased-application.dto'
import { UpdateDeceasedApplicationDto } from './dto/update-deceased-application.dto'
import { DeceasedApplicationModel } from './deceased-application.model'

@Controller({
  path: 'applications/deceased',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class DeceasedApplicationController {
  constructor(
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(DeceasedApplicationModel)
    private readonly deceasedApplicationModel: typeof DeceasedApplicationModel,
  ) {}

  @Post('')
  @LGResponse({
    operationId: 'createDeceasedCaseAndApplication',
    type: CaseDto,
  })
  async createDeceasedCaseAndApplication(
    @CurrentUser() user: Auth,
  ): Promise<CaseDto> {
    if (!user.nationalId) {
      throw new UnauthorizedException()
    }

    const model = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        deceasedApplication: {
          involvedPartyNationalId: user.nationalId,
        },
      },
      {
        returning: true,
        include: [DeceasedApplicationModel],
      },
    )

    return model.fromModel()
  }

  @Get(':caseId')
  @LGResponse({
    operationId: 'getDeceasedApplicationByCaseId',
    type: DeceasedApplicationDto,
  })
  async getDeceasedApplicationByCaseId(
    @CurrentUser() user: Auth,
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
  ): Promise<DeceasedApplicationDto> {
    const application = await this.deceasedApplicationModel.findOne({
      where: {
        caseId,
        involvedPartyNationalId: user.nationalId,
      },
    })

    if (!application) {
      throw new NotFoundException()
    }

    return application.fromModel()
  }

  @Patch(':caseId/:applicationId')
  @LGResponse({
    operationId: 'updateDeceasedApplication',
    status: 200,
  })
  async updateDeceasedApplication(
    @CurrentUser() user: Auth,
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @Param('applicationId', new UUIDValidationPipe()) applicationId: string,
    @Body() dto: UpdateDeceasedApplicationDto,
  ): Promise<void> {
    const application = await this.deceasedApplicationModel.findOne({
      where: {
        id: applicationId,
        caseId,
        involvedPartyNationalId: user.nationalId,
      },
    })

    if (!application) {
      throw new NotFoundException()
    }

    const signatureDate =
      typeof dto.signatureDate === 'string'
        ? new Date(dto.signatureDate)
        : dto.signatureDate

    const divisionMeetingDate =
      typeof dto.settlementMeetingDate === 'string'
        ? new Date(dto.settlementMeetingDate)
        : dto.settlementMeetingDate

    const settlementDateOfDeath =
      typeof dto.settlementDateOfDeath === 'string'
        ? new Date(dto.settlementDateOfDeath)
        : dto.settlementDateOfDeath

    const judgmentDate =
      typeof dto.judgmentDate === 'string'
        ? new Date(dto.judgmentDate)
        : dto.judgmentDate

    await application.update({
      judgmentDate: judgmentDate,
      additionalText: dto.additionalText,
      courtDistrictId: dto.courtDistrictId,
      liquidatorName: dto.liquidator,
      liquidatorLocation: dto.liquidatorLocation,
      liquidatorOnBehalfOf: dto.liquidatorOnBehalfOf,
      settlementName: dto.settlementName,
      settlementAddress: dto.settlementAddress,
      settlementNationalId: dto.settlementNationalId,
      settlementDateOfDeath: settlementDateOfDeath,
      divisionMeetingDate: divisionMeetingDate,
      divisionMeetingLocation: dto.settlementMeetingLocation,
      signatureLocation: dto.signatureLocation,
      signatureDate: signatureDate,
      publishingDates: dto.publishingDates?.map((date) => new Date(date)),
    })
  }
}
