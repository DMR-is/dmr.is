import addDays from 'date-fns/addDays'

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { Auth } from '@island.is/auth-nest-tools'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { RecallTypeEnum } from '../../../lib/constants'
import {
  bankruptcyRecallApplicationSchema,
  deceasedRecallApplicationSchema,
  RecallApplication,
  settlementSchema,
} from '../../../lib/schemas'
import { mapIndexToVersion } from '../../../lib/utils'
import { AdvertModel } from '../../advert/advert.model'
import { DivisionMeetingAdvertModel } from '../../advert/division/models/division-meeting-advert.model'
import { RecallAdvertModel } from '../../advert/recall/recall-advert.model'
import { CaseModel } from '../../case/case.model'
import { CaseDto } from '../../case/dto/case.dto'
import { CategoryDefaultIdEnum } from '../../category/category.model'
import { SettlementModel } from '../../settlement/settlement.model'
import { TypeIdEnum } from '../../type/type.model'
import { ApplicationStatusEnum } from '../contants'
import { RecallApplicationDto } from './dto/recall-application.dto'
import { UpdateRecallApplicationDto } from './dto/update-recall-application.dto'
import { RecallApplicationModel } from './recall-application.model'

@Controller({
  version: '1',
  path: 'applications/recalls',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class RecallApplicationController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(RecallApplicationModel)
    private readonly recallApplicationModel: typeof RecallApplicationModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Post(':recallType')
  @LGResponse({
    operationId: 'createRecallCaseAndApplication',
    type: CaseDto,
  })
  @ApiParam({
    enum: RecallTypeEnum,
    name: 'recallType',
    enumName: 'RecallTypeEnum',
  })
  async createRecallCaseAndApplication(
    @CurrentUser() user: Auth,
    @Param('recallType', new EnumValidationPipe(RecallTypeEnum))
    recallType: RecallTypeEnum,
  ): Promise<CaseDto> {
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    const results = await this.caseModel.create(
      {
        involvedPartyNationalId: user.nationalId,
        recallApplication: {
          recallType: recallType,
          involvedPartyNationalId: user.nationalId,
          publishingDates: [addDays(new Date(), 14)],
        },
      },
      {
        include: [{ model: RecallApplicationModel }],
        returning: true,
      },
    )

    return results.fromModel()
  }

  @Patch(':caseId/:applicationId')
  @LGResponse({ operationId: 'updateRecallApplication', status: 200 })
  async updateRecallApplication(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: Auth,
    @Body() body: UpdateRecallApplicationDto,
  ) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to update draft advert', {
        context: 'RecallApplicationController',
      })

      throw new UnauthorizedException('User not authenticated')
    }

    await this.recallApplicationModel.update(
      {
        courtDistrictId: body.courtDistrictId,
        additionalText: body.additionalText,
        judgmentDate: body.judgmentDate,
        signatureLocation: body.signatureLocation,
        signatureDate: body.signatureDate,
        liquidator: body.liquidator,
        liquidatorLocation: body.liquidatorLocation,
        liquidatorOnBehalfOf: body.liquidatorOnBehalfOf,
        settlementName: body.settlementName,
        settlementDeadline: body.settlementDeadline,
        settlementAddress: body.settlementAddress,
        settlementNationalId: body.settlementNationalId,
        settlementMeetingLocation: body.settlementMeetingLocation,
        settlementMeetingDate: body.settlementMeetingDate,
        settlementDateOfDeath: body.settlementDateOfDeath,
        publishingDates: body.publishingDates,
      },
      {
        where: {
          id: applicationId,
          caseId: caseId,
          involvedPartyNationalId: user.nationalId,
        },
      },
    )
  }

  @Post(':caseId/:applicationId/submit')
  @LGResponse({ operationId: 'submitRecallApplication' })
  async submitRecallApplication(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: Auth,
  ) {
    const nationalId = user?.nationalId
    if (!nationalId) {
      this.logger.debug(
        'Unauthorized access attempt to submit bankruptcy application',
      )
      throw new UnauthorizedException()
    }

    const application = await this.recallApplicationModel.findOne({
      where: {
        id: applicationId,
        caseId: caseId,
        involvedPartyNationalId: nationalId,
      },
    })

    if (!application) {
      this.logger.debug(
        `Application with id ${applicationId} not found for case ${caseId}`,
      )
      throw new NotFoundException('Application not found')
    }

    if (application.status !== ApplicationStatusEnum.DRAFT) {
      this.logger.debug(
        `Attempt to submit application with status ${application.status}`,
      )
      throw new BadRequestException('Application already submitted')
    }

    const dto = application.fromModel()

    const settlementCheck = settlementSchema.safeParse({
      liquidatorName: dto.liquidator,
      liquidatorLocation: dto.liquidatorLocation,
      liquidatorOnBehalfOf: dto.liquidatorOnBehalfOf,
      settlementName: dto.settlementName,
      settlementNationalId: dto.settlementNationalId,
      settlementAddress: dto.settlementAddress,
      settlementDeadline: dto.settlementDeadline
        ? new Date(dto.settlementDeadline)
        : undefined,
      settlementDateOfDeath: dto.settlementDateOfDeath
        ? new Date(dto.settlementDateOfDeath)
        : undefined,
    })

    if (!settlementCheck.success) {
      this.logger.debug('Invalid settlement data provided', {
        error: settlementCheck.error,
      })
      throw new BadRequestException()
    }

    const settlementModel = await this.settlementModel.create(
      settlementCheck.data,
      {
        returning: ['id'],
      },
    )

    const toParse: Partial<RecallApplication> = {
      recallType: dto.recallType,
      additionalText: dto.additionalText,
      judgmentDate: dto.judgmentDate ? new Date(dto.judgmentDate) : undefined,
      signatureLocation: dto.signatureLocation,
      signatureDate: dto.signatureDate
        ? new Date(dto.signatureDate)
        : undefined,
      courtDistrictId: dto.courtDistrict?.id,
      liquidatorName: dto.liquidator,
      liquidatorLocation: dto.liquidatorLocation,
      liquidatorOnBehalfOf: dto.liquidatorOnBehalfOf,
      settlementId: settlementModel.id,
      meetingDate: dto.settlementMeetingDate
        ? new Date(dto.settlementMeetingDate)
        : undefined,
      meetingLocation: dto.settlementMeetingLocation,
      publishingDates: dto.publishingDates?.map((d) => new Date(d)),
    }

    const parsedApplication =
      dto.recallType === RecallTypeEnum.BANKRUPTCY
        ? bankruptcyRecallApplicationSchema.safeParse({
            ...toParse,
            settlementDeadline: dto.settlementDeadline
              ? new Date(dto.settlementDeadline)
              : undefined,
          })
        : deceasedRecallApplicationSchema.safeParse({
            ...toParse,
            settlementDateOfDeath: dto.settlementDateOfDeath
              ? new Date(dto.settlementDateOfDeath)
              : undefined,
          })

    if (parsedApplication.success === false) {
      this.logger.debug('Invalid application data provided', {
        error: parsedApplication.error,
      })
      throw new BadRequestException('Invalid application data')
    }

    await this.advertModel.bulkCreate(
      parsedApplication.data.publishingDates.map((scheduledAtDate, i) => ({
        categoryId:
          dto.recallType === RecallTypeEnum.BANKRUPTCY
            ? CategoryDefaultIdEnum.BANKRUPTCY_RECALL
            : CategoryDefaultIdEnum.DECEASED_RECALL,
        caseId: caseId,
        typeId: TypeIdEnum.RECALL,
        scheduledAt: new Date(scheduledAtDate),
        submittedBy: nationalId,
        title: `Innköllun ${
          dto.recallType === RecallTypeEnum.BANKRUPTCY ? 'þrotabús' : 'dánarbús'
        } ${settlementCheck.data.settlementName}`,
        html: '<div>TODO: insert html</div>',
        paid: false,
        version: mapIndexToVersion(i),
        recallAdvert: {
          courtDistrictId: parsedApplication.data.courtDistrictId,
          additionalText: parsedApplication.data.additionalText,
          signatureLocation: parsedApplication.data.signatureLocation,
          signatureDate: parsedApplication.data.signatureDate,
          settlementId: parsedApplication.data.settlementId,
          recallType: parsedApplication.data.recallType,
        },
      })),
      {
        include: [
          {
            model: RecallAdvertModel,
            as: 'recallAdvert',
          },
        ],
      },
    )

    await this.advertModel.create(
      {
        categoryId:
          dto.recallType === RecallTypeEnum.BANKRUPTCY
            ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
            : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
        caseId: caseId,
        typeId: TypeIdEnum.DIVISION_MEETING,
        scheduledAt: parsedApplication.data.meetingDate,
        title: 'Skiptafundur',
        html: '<div>TODO: insert html</div>',
        submittedBy: nationalId,
        paid: false,
        divisionMeetingAdvert: {
          meetingDate: parsedApplication.data.meetingDate,
          meetingLocation: parsedApplication.data.meetingLocation,
          settlementId: parsedApplication.data.settlementId,
          recallType: parsedApplication.data.recallType,
        },
      },
      {
        include: [
          { model: DivisionMeetingAdvertModel, as: 'divisionMeetingAdvert' },
        ],
      },
    )

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  @Get(':caseId')
  @LGResponse({
    operationId: 'getRecallApplicationByCaseId',
    type: RecallApplicationDto,
  })
  async getRecallApplicationByCaseId(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @CurrentUser() user: Auth,
  ): Promise<RecallApplicationDto> {
    const nationalId = user?.nationalId
    if (!nationalId) {
      this.logger.debug(
        'Unauthorized access attempt to get bankruptcy application',
      )
      throw new UnauthorizedException()
    }

    const application = await this.recallApplicationModel.findOne({
      where: {
        caseId: caseId,
        involvedPartyNationalId: nationalId,
      },
    })

    if (!application) {
      throw new NotFoundException('Application not found')
    }

    return application.fromModel()
  }

  @Delete(':applicationId')
  @LGResponse({ operationId: 'deleteRecallApplication' })
  async deleteRecallApplication(
    @CurrentUser() user: Auth,
    @Param('applicationId') applicationId: string,
  ): Promise<void> {
    if (!user?.nationalId) {
      throw new UnauthorizedException()
    }

    await this.recallApplicationModel.destroy({
      where: {
        id: applicationId,
        involvedPartyNationalId: user.nationalId,
      },
    })
  }
}
