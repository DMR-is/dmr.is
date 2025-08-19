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
import { CreateDivisionMeetingForApplicationDto } from './dto/create-division-meeting-for-application.dto'
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

    const divsionMeetings =
      theCase?.adverts?.filter(
        (ad) => ad.typeId === TypeIdEnum.DIVISION_MEETING,
      ) ?? []

    if (divsionMeetings.length >= 3) {
      throw new BadRequestException(
        'A maximum of 3 division meetings can be created for a recall application.',
      )
    }

    if (divsionMeetings.length > 0) {
      const lastDivisionAdvert = divsionMeetings[divsionMeetings.length - 1]
      const divisionMeetingAdvert = lastDivisionAdvert.divisionMeetingAdvert

      if (!divisionMeetingAdvert) {
        throw new BadRequestException(
          'Last division meeting advert does not have a division meeting advert associated with it.',
        )
      }

      const newMeeting = await this.advertModel.create(
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
          divisionMeetingAdvert: {
            meetingDate: new Date(body.meetingDate),
            meetingLocation: body.meetingLocation,
            recallType: divisionMeetingAdvert.recallType,
            settlementId: divisionMeetingAdvert.settlementId,
          },
        },
        {
          include: [
            { model: DivisionMeetingAdvertModel, as: 'divisionMeetingAdvert' },
          ],
        },
      )

      throw new Error(
        'Todo: Implement logic to handle new division meeting advert creation',
      )
    }

    // const recallAdvert = await this.recallAdvertModel.findOne({
    //   include: [
    //     {
    //       model: AdvertModel,
    //       required: true,
    //       where: {
    //         caseId: caseId,
    //       },
    //       include: [
    //         {
    //           model: CaseModel,
    //           required: true,
    //           where: { id: caseId, involvedPartyNationalId: user.nationalId },
    //         },
    //       ],
    //     },
    //   ],
    // })

    // if (!recallAdvert) {
    //   this.logger.debug(`Recall advert not found for case ${caseId}`)
    //   throw new NotFoundException('Recall advert not found')
    // }

    // // check how many division meetings already exist for this application
    // const totalDivisionMeetings = await this.advertModel.count({
    //   where: { type: TypeIdEnum.DIVISION_MEETING, caseId },
    // })

    // if (totalDivisionMeetings >= 3) {
    //   this.logger.debug('Attempt to create more than 3 division meetings', {
    //     caseId,
    //   })
    //   throw new BadRequestException(
    //     'A maximum of 3 division meetings can be created for a recall application.',
    //   )
    // }

    // const settlement = recallAdvert.settlement
    // const submittedBy = `${user.name}${user.actor ? ` (${user.actor})` : ''}`

    // await this.advertModel.create({
    //   caseId,
    //   typeId: TypeIdEnum.DIVISION_MEETING,
    //   categoryId:
    //     recallAdvert.recallType === RecallTypeEnum.BANKRUPTCY
    //       ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
    //       : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
    //   scheduledAt: new Date(body.meetingDate),
    //   title: 'Skiptafundur',
    //   html: '<div>TODO: insert html</div>',
    //   submittedBy: submittedBy,
    //   paid: false,
    //   divisionMeetingAdvert: {
    //     recallType: recallAdvert.recallType,
    //     settlementId: settlement.id,
    //     meetingLocation: body.meetingLocation,
    //     meetingDate: new Date(body.meetingDate),
    //   },
    // })
  }

  @Post(':caseId/:applicationId/division-ending')
  @LGResponse({ operationId: 'createDivisionEndingAdvert' })
  async createDivisionEndingAdvert(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: Auth,
  ): Promise<void> {}
}
