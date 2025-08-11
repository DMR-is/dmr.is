import {
  BadRequestException,
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
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { Auth } from '@island.is/auth-nest-tools'

import { mapIndexToVersion } from '../../../lib/utils'
import { AdvertModel } from '../../advert/advert.model'
import { bankruptcyAdvertSchema } from '../../bankruptcy/advert/bankruptcy-advert.model'
import { bankruptcyDivisionAdvertSchema } from '../../bankruptcy/division-advert/bankruptcy-division-advert.model'
import { CaseModel } from '../../case/case.model'
import { CategoryDefaultIdEnum } from '../../category/category.model'
import {
  SettlementModel,
  settlementSchema,
} from '../../settlement/settlement.model'
import { TypeEnum, TypeIdEnum } from '../../type/type.model'
import { ApplicationStatusEnum } from '../contants'
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
    @InjectModel(SettlementModel)
    private readonly settlementModel: typeof SettlementModel,
    @InjectModel(AdvertModel) private readonly advertModel: typeof AdvertModel,
  ) {}

  @Post(':caseId')
  @LGResponse({
    operationId: 'createBankruptcyApplication',
    type: BankruptcyApplicationDto,
  })
  async createBankruptcyApplication(
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

    const model = await this.bankruptcyApplicationModel.create({
      caseId: caseId,
      involvedPartyNationalId: user.nationalId,
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

    const application = await this.bankruptcyApplicationModel.findOne({
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

    const advertCheck = bankruptcyAdvertSchema.safeParse({
      judgmentDate: dto.judgmentDate,
      signatureLocation: dto.signatureLocation,
      signatureDate: dto.signatureDate,
      additionalText: dto.additionalText,
      settlementId: settlementModel.id,
      courtDistrictId: dto.courtDistrict?.id,
    })

    if (!advertCheck.success) {
      throw new BadRequestException('Invalid advert data')
    }

    await this.advertModel.createBankruptcyAdverts(
      dto.publishingDates.map((scheduledAtDate, i) => ({
        categoryId: CategoryDefaultIdEnum.BANKRUPTCY_ADVERT,
        caseId: caseId,
        typeId: TypeIdEnum.BANKRUPTCY_ADVERT,
        scheduledAt: new Date(scheduledAtDate),
        submittedBy: nationalId,
        title: `${TypeEnum.BANKRUPTCY_ADVERT} ${settlementCheck.data.settlementName}`,
        html: '<div>TODO: insert html</div>',
        paid: false,
        version: mapIndexToVersion(i),
        bankruptcyAdvert: advertCheck.data,
      })),
    )

    const bankruptcyDivisionAdvertCheck =
      bankruptcyDivisionAdvertSchema.safeParse({
        meetingDate: dto.settlementMeetingDate,
        meetingLocation: dto.settlementMeetingLocation,
        settlementId: settlementModel.id,
      })

    if (!bankruptcyDivisionAdvertCheck.success) {
      this.logger.debug('Invalid bankruptcy division advert data provided')
      throw new BadRequestException('Invalid bankruptcy division advert data')
    }

    await this.advertModel.createBankruptcyDivisionAdvert({
      caseId: caseId,
      scheduledAt: new Date(bankruptcyDivisionAdvertCheck.data.meetingDate),
      submittedBy: nationalId,
      title: `Skiptafundur ${settlementCheck.data.settlementName}`,
      html: '<div>TODO: insert html</div>',
      paid: false,
      bankruptcyDivisionAdvert: {
        meetingDate: bankruptcyDivisionAdvertCheck.data.meetingDate,
        meetingLocation: bankruptcyDivisionAdvertCheck.data.meetingLocation,
        settlementId: settlementModel.id,
      },
    })

    await application.update({ status: ApplicationStatusEnum.SUBMITTED })
  }

  @Get(':caseId')
  @LGResponse({
    operationId: 'getBankruptcyApplicationByCaseId',
    type: BankruptcyApplicationDto,
  })
  async getBankruptcyApplicationByCaseId(
    @Param('caseId', new UUIDValidationPipe()) caseId: string,
    @CurrentUser() user: Auth,
  ): Promise<BankruptcyApplicationDto> {
    const nationalId = user?.nationalId
    if (!nationalId) {
      this.logger.debug(
        'Unauthorized access attempt to get bankruptcy application',
      )
      throw new UnauthorizedException()
    }

    const application = await this.bankruptcyApplicationModel.findOne({
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
}
