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
import { ApiBearerAuth } from '@nestjs/swagger'

import { CurrentUser } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { TokenJwtAuthGuard } from '@dmr.is/modules'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { Auth } from '@island.is/auth-nest-tools'

import { LGResponse } from '../../../decorators/lg-response.decorator'
import { ApplicationTypeEnum } from '../../../lib/constants'
import { mapIndexToVersion } from '../../../lib/utils'
import { AdvertModel } from '../../advert/advert.model'
import { recallAdvertSchema } from '../../advert/recall/recall-advert.model'
import { CaseModel } from '../../case/case.model'
import { CaseDto } from '../../case/dto/case.dto'
import { CategoryDefaultIdEnum } from '../../category/category.model'
import {
  SettlementModel,
  settlementSchema,
} from '../../settlement/settlement.model'
import { TypeIdEnum } from '../../type/type.model'
import { ApplicationStatusEnum } from '../contants'
import { RecallApplicationDto } from './dto/recall-application.dto'
import { UpdateRecallApplicationDto } from './dto/update-recall-application.dto'
import { RecallApplicationModel } from './recall-application.model'

@Controller({
  version: '1',
  path: 'applications/bankruptcy',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard)
export class BankruptcyApplicationController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @InjectModel(RecallApplicationModel)
    private readonly recallApplicationModel: typeof RecallApplicationModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Post('')
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
        recallApplication: {
          type: ApplicationTypeEnum.BANKRUPTCY,
          involvedPartyNationalId: user.nationalId,
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
  @LGResponse({ operationId: 'updateBankruptcyApplication', status: 200 })
  async updateBankruptcyApplication(
    @Param('caseId') caseId: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: Auth,
    @Body() body: UpdateRecallApplicationDto,
  ) {
    if (!user?.nationalId) {
      this.logger.warn('Unauthorized access attempt to update draft advert', {
        context: 'BankruptcyApplicationController',
      })

      throw new UnauthorizedException('User not authenticated')
    }

    // todo: implement update
  }

  @Post(':caseId/:applicationId/submit')
  @LGResponse({ operationId: 'submitBankruptcyApplication' })
  async submit(
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
      settlementDeadline: dto.settlementDeadline,
    })

    if (!settlementCheck.success) {
      this.logger.debug(
        'Invalid settlement data provided for bankruptcy advert',
        { error: settlementCheck.error },
      )
      throw new BadRequestException()
    }

    const settlementModel = await this.settlementModel.create(
      settlementCheck.data,
      {
        returning: ['id'],
      },
    )

    if (!dto.publishingDates || dto.publishingDates.length === 0) {
      this.logger.debug('No publishing dates provided for bankruptcy advert')
      throw new BadRequestException()
    }

    const advertCheck = recallAdvertSchema.safeParse({
      judgmentDate: dto.judgmentDate,
      signatureLocation: dto.signatureLocation,
      signatureDate: dto.signatureDate,
      additionalText: dto.additionalText,
      settlementId: settlementModel.id,
      courtDistrictId: dto.courtDistrict?.id,
    })

    if (!advertCheck.success) {
      this.logger.debug(
        `Invalid advert data provided for bankruptcy advert: ${advertCheck.error}`,
      )
      throw new BadRequestException('Invalid advert data')
    }

    await this.advertModel.createBankruptcyAdverts(
      dto.publishingDates.map((scheduledAtDate, i) => ({
        categoryId: CategoryDefaultIdEnum.BANKRUPTCY_RECALL,
        caseId: caseId,
        typeId: TypeIdEnum.RECALL,
        scheduledAt: new Date(scheduledAtDate),
        submittedBy: nationalId,
        title: `todo:fix ${settlementCheck.data.settlementName}`,
        html: '<div>TODO: insert html</div>',
        paid: false,
        version: mapIndexToVersion(i),
        bankruptcyAdvert: advertCheck.data,
      })),
    )

    // const recallDivisionAdvertCheck = recallDivisionAdvertSchema.safeParse({
    //   meetingDate: dto.settlementMeetingDate,
    //   meetingLocation: dto.settlementMeetingLocation,
    //   settlementId: settlementModel.id,
    // })

    // if (!bankruptcyDivisionAdvertCheck.success) {
    //   this.logger.debug('Invalid bankruptcy division advert data provided')
    //   throw new BadRequestException('Invalid bankruptcy division advert data')
    // }

    // await this.advertModel.createDivisionMeetingAdvert({
    //   caseId: caseId,
    //   scheduledAt: new Date(bankruptcyDivisionAdvertCheck.data.meetingDate),
    //   submittedBy: nationalId,
    //   title: `Skiptafundur ${settlementCheck.data.settlementName}`,
    //   html: '<div>TODO: insert html</div>',
    //   paid: false,
    //   categoryId:
    //     dto.type === ApplicationTypeEnum.BANKRUPTCY
    //       ? CategoryDefaultIdEnum.BANKRUPTCY_DIVISION_MEETING
    //       : CategoryDefaultIdEnum.DECEASED_DIVISION_MEETING,
    //   divisionMeetingAdvert: {
    //     meetingDate: bankruptcyDivisionAdvertCheck.data.meetingDate,
    //     meetingLocation: bankruptcyDivisionAdvertCheck.data.meetingLocation,
    //     settlementId: settlementModel.id,
    //     type: dto.type,
    //   },
    // })

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  @Get(':caseId')
  @LGResponse({
    operationId: 'getBankruptcyApplicationByCaseId',
    type: RecallApplicationDto,
  })
  async getBankruptcyApplicationByCaseId(
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
