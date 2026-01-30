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
import { ApiBearerAuth } from '@nestjs/swagger'

import {
  PublicOrApplicationWebScopes,
  PublicWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { CanEditGuard, CanEditOrPublishGuard } from '../../../core/guards'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import {
  AdvertPublicationDetailedDto,
  GetPublicationsDto,
  GetPublicationsQueryDto,
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

  @PublicWebScopes()
  @Get()
  @LGResponse({
    operationId: 'getPublications',
    type: GetPublicationsDto,
  })
  async getPublishedPublications(
    @Query() query: GetPublicationsQueryDto,
  ): Promise<GetPublicationsDto> {
    return this.advertPublicationService.getPublications(query)
  }

  @PublicOrApplicationWebScopes()
  @AdminAccess()
  @Get('/:publicationId')
  @LGResponse({
    operationId: 'getAdvertPublication',
    type: AdvertPublicationDetailedDto,
  })
  async getPublicationById(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ) {
    return this.advertPublicationService.getPublicationById(publicationId)
  }

  @AdminAccess()
  @UseGuards(CanEditGuard)
  @Post('create/:advertId')
  @LGResponse({ operationId: 'createPublication' })
  async createAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    await this.advertPublicationService.createPublication(advertId)
  }

  @AdminAccess()
  @UseGuards(CanEditOrPublishGuard)
  @Patch('/:publicationId')
  @LGResponse({ operationId: 'updatePublication' })
  async updatePublication(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @Body() body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    await this.advertPublicationService.updatePublication(publicationId, body)
  }

  @AdminAccess()
  @UseGuards(CanEditGuard)
  @Delete('/:publicationId')
  @LGResponse({ operationId: 'deletePublication' })
  async deletePublication(
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ): Promise<void> {
    await this.advertPublicationService.deletePublication(publicationId)
  }
}
