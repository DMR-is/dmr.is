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
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'

import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared/modules/guards/auth'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { CanEditGuard, CanEditOrPublishGuard } from '../../../core/guards'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  PublicOrApplicationWebScopes,
  PublicWebScopes,
} from '../../../core/guards/scope-guards/scopes.decorator'
import {
  AdvertPublicationDetailedDto,
  AdvertVersionEnum,
  GetCombinedHTMLDto,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  GetRelatedPublicationsDto,
  UpdateAdvertPublicationDto,
} from '../../../models/advert-publication.model'
import { IPublicationService } from './publication.service.interface'

@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@Controller({
  path: '/publications',
  version: '1',
})
export class AdvertPublicationController {
  constructor(
    @Inject(IPublicationService)
    readonly advertPublicationService: IPublicationService,
  ) {}

  @Get()
  @LGResponse({
    operationId: 'getPublications',
    type: GetPublicationsDto,
  })
  @PublicWebScopes()
  async getPublishedPublications(
    @Query() query: GetPublicationsQueryDto,
  ): Promise<GetPublicationsDto> {
    return this.advertPublicationService.getPublications(query)
  }

  @PublicWebScopes()
  @Get('/get-combined-html')
  @LGResponse({
    operationId: 'getCombinedHTML',
    type: GetCombinedHTMLDto,
  })
  async getCombinedHTML(
    @Query() query: GetPublicationsQueryDto,
  ): Promise<GetCombinedHTMLDto> {
    return this.advertPublicationService.getPublicationsCombinedHTML(query)
  }

  @Get('/:publicationId')
  @LGResponse({
    operationId: 'getAdvertPublication',
    type: AdvertPublicationDetailedDto,
  })
  @AdminAccess()
  @PublicOrApplicationWebScopes()
  async getPublicationById(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ) {
    return this.advertPublicationService.getPublicationById(publicationId)
  }

  @Get('/:publicationNumber/:version')
  @LGResponse({
    operationId: 'getPublicationByNumberAndVersion',
    type: AdvertPublicationDetailedDto,
  })
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
    enumName: 'AdvertVersionEnum',
  })
  @PublicWebScopes()
  async getPublicationByNumberAndVersion(
    @Param('publicationNumber') publicationNumber: string,
    @Param('version', new EnumValidationPipe(AdvertVersionEnum))
    version: AdvertVersionEnum,
  ): Promise<AdvertPublicationDetailedDto> {
    return this.advertPublicationService.getPublicationByNumberAndVersion(
      publicationNumber,
      version,
    )
  }

  @Get('/related/:publicationNumber/:version')
  @LGResponse({
    operationId: 'getRelatedPublications',
    type: GetRelatedPublicationsDto,
  })
  @PublicWebScopes()
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
    enumName: 'AdvertVersionEnum',
  })
  async getRelatedPublications(
    @Param('publicationNumber') publicationNumber: string,
    @Param('version', new EnumValidationPipe(AdvertVersionEnum))
    version: AdvertVersionEnum,
  ): Promise<GetRelatedPublicationsDto> {
    return this.advertPublicationService.getRelatedPublications(
      publicationNumber,
      version,
    )
  }

  @Post('create/:advertId')
  @LGResponse({ operationId: 'createPublication' })
  @AdminAccess()
  @UseGuards(CanEditGuard)
  async createAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    await this.advertPublicationService.createPublication(advertId)
  }

  @Patch('/:publicationId')
  @LGResponse({ operationId: 'updatePublication' })
  @AdminAccess()
  @UseGuards(CanEditOrPublishGuard)
  async updatePublication(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @Body() body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    await this.advertPublicationService.updatePublication(publicationId, body)
  }

  @Delete('/:publicationId')
  @LGResponse({ operationId: 'deletePublication' })
  @AdminAccess()
  @UseGuards(CanEditGuard)
  async deletePublication(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ): Promise<void> {
    await this.advertPublicationService.deletePublication(publicationId)
  }
}
