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

import { DMRUser } from '@dmr.is/auth/dmrUser'
import { CurrentUser } from '@dmr.is/decorators'
import {
  PublicOrApplicationWebScopes,
  PublicWebScopes,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { AdminAccess } from '../../../core/decorators/admin.decorator'
import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../../core/guards/authorization.guard'
import { CanPublishGuard } from '../../../core/guards/can-publish.guard'
import {
  AdvertPublicationDetailedDto,
  AdvertVersionEnum,
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
  @Get('/adverts/:advertId/:version')
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
    enumName: 'AdvertVersionEnum',
  })
  @LGResponse({
    operationId: 'getAdvertPublication',
    type: AdvertPublicationDetailedDto,
  })
  async getPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('version', new EnumValidationPipe(AdvertVersionEnum))
    version: AdvertVersionEnum,
  ) {
    return this.advertPublicationService.getAdvertPublication(advertId, version)
  }

  @AdminAccess()
  @Post('/adverts/:advertId')
  @LGResponse({ operationId: 'createAdvertPublication' })
  async createAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    await this.advertPublicationService.createAdvertPublication(advertId)
  }

  @AdminAccess()
  @Post(':publicationId/adverts/:advertId/publish')
  @LGResponse({ operationId: 'publishAdvertPublication' })
  async publishAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @CurrentUser() currentUser: DMRUser,
  ): Promise<void> {
    await this.advertPublicationService.publishAdvertPublication(
      advertId,
      publicationId,
      currentUser,
    )
  }

  @AdminAccess()
  @Patch('/:publicationId/adverts/:advertId')
  @LGResponse({ operationId: 'updateAdvertPublication' })
  async updateAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @Body() body: UpdateAdvertPublicationDto,
    @CurrentUser() currentUser: DMRUser,
  ): Promise<void> {
    await this.advertPublicationService.updateAdvertPublication(
      advertId,
      publicationId,
      body,
      currentUser,
    )
  }

  @AdminAccess()
  @Delete('/:publicationId/adverts/:advertId')
  @LGResponse({ operationId: 'deleteAdvertPublication' })
  async deleteAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ): Promise<void> {
    await this.advertPublicationService.deleteAdvertPublication(
      advertId,
      publicationId,
    )
  }

  @Post('/adverts/:advertId/next/publish')
  @AdminAccess()
  @UseGuards(CanPublishGuard)
  @LGResponse({ operationId: 'publishNextPublication' })
  async publishNextPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    return this.advertPublicationService.publishNextPublication(advertId)
  }
}
