import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import { ApplicationTypeEnum } from '@dmr.is/legal-gazette/schemas'
import { EnumValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared/modules'

import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { GetMyApplicationsQueryDto } from '../../core/dto/application.dto'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { OwnershipGuard } from '../../core/guards/ownership.guard'
import { ApplicationWebScopes } from '../../core/guards/scope-guards/scopes.decorator'
import {
  ApplicationDetailedDto,
  ApplicationDto,
  GetApplicationEstimatedPriceDto,
  GetApplicationsDto,
  GetHTMLPreview,
  UpdateApplicationDto,
} from '../../models/application.model'
import { IAdvertService } from '../advert/advert.service.interface'
import { IPriceCalculatorService } from '../advert/calculator/price-calculator.service.interface'
import { IApplicationService } from './application.service.interface'

@ApiBearerAuth()
@ApplicationWebScopes()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@Controller({
  path: 'applications',
  version: '1',
})
export class ApplicationController {
  constructor(
    @Inject(IAdvertService) private readonly advertService: IAdvertService,
    @Inject(IApplicationService)
    private readonly applicationService: IApplicationService,
    @Inject(IPriceCalculatorService)
    private readonly priceCalculatorService: IPriceCalculatorService,
  ) {}

  @Post('createApplication/:applicationType')
  @ApiParam({
    name: 'applicationType',
    enum: ApplicationTypeEnum,
    required: true,
  })
  @LGResponse({ operationId: 'createApplication', type: ApplicationDto })
  async createApplication(
    @Param('applicationType', new EnumValidationPipe(ApplicationTypeEnum))
    applicationType: ApplicationTypeEnum,
    @CurrentUser() user: DMRUser,
  ): Promise<ApplicationDto> {
    return this.applicationService.createApplication(applicationType, user)
  }

  @Post('submitApplication/:applicationId')
  @LGResponse({ operationId: 'submitApplication' })
  @UseGuards(OwnershipGuard)
  async submitApplication(
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: DMRUser,
  ): Promise<void> {
    return this.applicationService.submitApplication(applicationId, user)
  }

  @Get('getMyApplications')
  @LGResponse({ operationId: 'getMyApplications', type: GetApplicationsDto })
  async getMyApplications(
    @Query() query: GetMyApplicationsQueryDto,
    @CurrentUser() user: DMRUser,
  ): Promise<GetApplicationsDto> {
    return this.applicationService.getMyApplications(query, user)
  }

  @Get('getApplicationById/:applicationId')
  @LGResponse({
    operationId: 'getApplicationById',
    type: ApplicationDetailedDto,
  })
  @UseGuards(OwnershipGuard)
  async getApplicationById(
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.getApplicationById(applicationId)
  }

  @Get('getApplicationByCaseId/:caseId')
  @LGResponse({
    operationId: 'getApplicationByCaseId',
    type: ApplicationDetailedDto,
  })
  @UseGuards(OwnershipGuard)
  async getApplicationByCaseId(
    @Param('caseId') caseId: string,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.getApplicationByCaseId(caseId)
  }

  @Patch(':applicationId')
  @LGResponse({
    operationId: 'updateApplication',
    type: ApplicationDetailedDto,
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  @UseGuards(OwnershipGuard)
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() body: UpdateApplicationDto,
  ): Promise<ApplicationDetailedDto> {
    return this.applicationService.updateApplication(applicationId, body)
  }

  @Get(':applicationId/preview')
  @LGResponse({ operationId: 'previewApplication', type: GetHTMLPreview })
  @UseGuards(OwnershipGuard)
  async previewApplication(
    @Param('applicationId') applicationId: string,
  ): Promise<GetHTMLPreview> {
    return this.applicationService.previewApplication(applicationId)
  }

  @Get(':applicationId/price')
  @LGResponse({
    operationId: 'getApplicationPrice',
    type: GetApplicationEstimatedPriceDto,
  })
  @UseGuards(OwnershipGuard)
  async getApplicationPrice(
    @Param('applicationId') applicationId: string,
  ): Promise<GetApplicationEstimatedPriceDto> {
    const price =
      await this.priceCalculatorService.getEstimatedPriceForApplication(
        applicationId,
      )
    return { price }
  }

  @Delete(':applicationId/:advertId')
  @UseGuards(OwnershipGuard)
  @LGResponse({ operationId: 'deleteAdvertFromApplication' })
  async deleteAdvertFromApplication(
    @Param('applicationId') _applicationId: string, // USED FOR OWNERSHIP GUARD TO VERIFY OWNERSHIP
    @Param('advertId') advertId: string,
  ): Promise<void> {
    return this.advertService.deleteAdvert(advertId)
  }

  @Delete(':applicationId')
  @UseGuards(OwnershipGuard)
  @LGResponse({ operationId: 'deleteApplication' })
  async deleteApplication(
    @Param('applicationId') applicationId: string,
  ): Promise<void> {
    return this.applicationService.deleteApplication(applicationId)
  }
}
