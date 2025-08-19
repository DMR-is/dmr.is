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

import { DMRUser } from '@dmr.is/auth/dmrUser'
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
import {
  CreateDivisionEndingMeetingForApplicationDto,
  CreateDivisionMeetingForApplicationDto,
} from './dto/create-division-meeting-for-application.dto'
import { RecallApplicationDto } from './dto/recall-application.dto'
import { UpdateRecallApplicationDto } from './dto/update-recall-application.dto'
import { RecallApplicationModel } from './recall-application.model'

@Controller({
  version: '1',
  path: 'applications/recalls',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class RecallApplicationtroller {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(RecallApplicationModel)
    private readonly recallApplicationModel: typeof RecallApplicationModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,

    @InjectModel(RecallAdvertModel)
    private readonly recallAdvertModel: typeof RecallAdvertModel,
  ) {}

  @Post(':recallType')
  @ApiParam({
    name: 'recallType',
    enum: RecallTypeEnum,
  })
  @LGResponse({
    operationId: 'createRecallCaseAndApplication',
    type: CaseDto,
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
        error: JSON.parse(JSON.stringify(parsedApplication.error)),
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
        signatureName: parsedApplication.data.liquidatorName,
        signatureLocation: parsedApplication.data.signatureLocation,
        signatureDate: parsedApplication.data.signatureDate,
        recallAdvert: {
          courtDistrictId: parsedApplication.data.courtDistrictId,
          additionalText: parsedApplication.data.additionalText,
          settlementId: parsedApplication.data.settlementId,
          recallType: parsedApplication.data.recallType,
        },
      })),
      {
        include: [
          {
            model: RecallAdvertModel,
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
        html: '<div>TODO: insert html</div>',
        submittedBy: nationalId,
        paid: false,
        signatureDate: parsedApplication.data.signatureDate,
        signatureLocation: parsedApplication.data.signatureLocation,
        signatureName: parsedApplication.data.liquidatorName,
        divisionMeetingAdvert: {
          meetingDate: parsedApplication.data.meetingDate,
          meetingLocation: parsedApplication.data.meetingLocation,
          settlementId: parsedApplication.data.settlementId,
          recallType: parsedApplication.data.recallType,
        },
      },
      {
        include: [{ model: DivisionMeetingAdvertModel }],
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

  @Post(':caseId/division-meeting')
  @LGResponse({ operationId: 'createDivisionMeetingForApplication' })
  async createDivisionMeetingForApplication(
    @Param('caseId') caseId: string,
    @CurrentUser() user: DMRUser,
    @Body() body: CreateDivisionMeetingForApplicationDto,
  ): Promise<void> {
    const theCase = await this.caseModel.findOne({
      where: {
        id: caseId,
        involvedPartyNationalId: user.nationalId,
      },
      include: [
        {
          model: AdvertModel,
          include: [RecallAdvertModel, DivisionMeetingAdvertModel],
        },
      ],
    })

    const recallAdverts =
      theCase?.adverts?.filter((ad) => ad.typeId === TypeIdEnum.RECALL) ?? []

    if (!recallAdverts.length) {
      throw new BadRequestException(
        'No recall adverts found for this case. Please create a recall application first.',
      )
    }

    const divisionMeetings =
      theCase?.adverts?.filter(
        (ad) => ad.typeId === TypeIdEnum.DIVISION_MEETING,
      ) ?? []

    if (divisionMeetings.length >= 3) {
      throw new BadRequestException(
        'A maximum of 3 division meetings can be created for a recall application.',
      )
    }

    if (divisionMeetings.length > 0) {
      const lastDivisionAdvert = divisionMeetings.reduce(
        (youngest, current) => {
          return new Date(current.scheduledAt) > new Date(youngest.scheduledAt)
            ? current
            : youngest
        },
        divisionMeetings[0],
      )

      const divisionMeetingAdvert = lastDivisionAdvert.divisionMeetingAdvert

      if (!divisionMeetingAdvert) {
        throw new BadRequestException(
          'Last division meeting advert does not have a division meeting advert associated with it.',
        )
      }

      if (lastDivisionAdvert.scheduledAt > new Date(body.meetingDate)) {
        throw new BadRequestException(
          'New division meeting date must be after the last division meeting date.',
        )
      }

      await this.advertModel.create(
        {
          caseId: caseId,
          typeId: TypeIdEnum.DIVISION_MEETING,
          categoryId:
            lastDivisionAdvert.recallAdvert?.recallType ===
            RecallTypeEnum.BANKRUPTCY
              ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
              : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
          scheduledAt: new Date(body.meetingDate),
          html: '<div>TODO: insert html</div>',
          submittedBy: `${user.name}${user.actor ? ` (${user.actor})` : ''}`,
          paid: false,
          version: mapIndexToVersion(divisionMeetings.length),
          signatureName: lastDivisionAdvert.signatureName,
          signatureLocation: lastDivisionAdvert.signatureLocation,
          signatureDate: lastDivisionAdvert.signatureDate,
          divisionMeetingAdvert: {
            meetingDate: new Date(body.meetingDate),
            meetingLocation: body.meetingLocation,
            recallType: divisionMeetingAdvert.recallType,
            settlementId: divisionMeetingAdvert.settlementId,
          },
        },
        {
          include: [{ model: DivisionMeetingAdvertModel }],
        },
      )

      return
    }

    // If no division meetings exist, create the first one
    const advert = recallAdverts[0]
    const firstRecallAdvert = advert?.recallAdvert

    if (!firstRecallAdvert) {
      throw new BadRequestException(
        'No recall advert found for this case. Please create a recall application first.',
      )
    }

    await this.advertModel.create(
      {
        caseId: caseId,
        typeId: TypeIdEnum.DIVISION_MEETING,
        categoryId:
          firstRecallAdvert.recallType === RecallTypeEnum.BANKRUPTCY
            ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
            : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
        scheduledAt: new Date(body.meetingDate),
        html: '<div>TODO: insert html</div>',
        submittedBy: `${user.name}${user.actor ? ` (${user.actor})` : ''}`,
        paid: false,
        signatureName: advert.signatureName,
        signatureLocation: advert.signatureLocation,
        signatureDate: advert.signatureDate,
        divisionMeetingAdvert: {
          meetingDate: new Date(body.meetingDate),
          meetingLocation: body.meetingLocation,
          recallType: firstRecallAdvert.recallType,
          settlementId: firstRecallAdvert.settlementId,
        },
      },
      {
        include: [{ model: DivisionMeetingAdvertModel }],
      },
    )
  }

  @Post(':caseId/division-ending')
  @LGResponse({ operationId: 'createDivisionEndingForApplication' })
  async createDivisionEndingForApplication(
    @Param('caseId') caseId: string,
    @Body() body: CreateDivisionEndingMeetingForApplicationDto,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    // check if there already exists a division ending advert for this application

    const existingAdverts = await this.advertModel.findAll({
      where: {
        caseId: caseId,
      },
      include: [{ model: DivisionMeetingAdvertModel }],
    })

    const existingDivisionEnding = existingAdverts.find(
      (ad) => ad.typeId === TypeIdEnum.DIVISION_ENDING,
    )

    if (existingDivisionEnding) {
      throw new BadRequestException(
        'Division ending advert already exists for this application',
      )
    }

    const divisionMeetings = existingAdverts.filter(
      (ad) => ad.typeId === TypeIdEnum.DIVISION_MEETING,
    )
    const existingDivisionMeeting = divisionMeetings.reduce(
      (youngest, current) => {
        return new Date(current.scheduledAt) > new Date(youngest.scheduledAt)
          ? current
          : youngest
      },
      divisionMeetings[0],
    )

    if (
      !existingDivisionMeeting ||
      !existingDivisionMeeting.divisionMeetingAdvert
    ) {
      throw new BadRequestException(
        'No division meeting advert found for this application. Please create a division meeting first.',
      )
    }

    const submittedBy = `${user.name}${user.actor ? ` (${user.actor})` : ''}`

    await this.advertModel.create({
      caseId: caseId,
      typeId: TypeIdEnum.DIVISION_ENDING,
      categoryId: CategoryDefaultIdEnum.DIVISION_ENDING,
      scheduledAt: new Date(body.meetingDate),
      html: '<div>TODO: insert html</div>',
      submittedBy: submittedBy,
      paid: false,
      signatureDate: existingDivisionMeeting.signatureDate,
      signatureLocation: existingDivisionMeeting.signatureLocation,
      signatureName: existingDivisionMeeting.signatureName,
      divisionEndingAdvert: {
        meetingDate: new Date(body.meetingDate),
        meetingLocation: body.meetingLocation,
        settlementId:
          existingDivisionMeeting.divisionMeetingAdvert?.settlementId,
        recallType: existingDivisionMeeting.divisionMeetingAdvert?.recallType,
      },
    })
  }
}
