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
import { ApiParam } from '@nestjs/swagger'

import {
  PublicOrApplicationWebScopes,
  PublicWebScopes,
  ScopesGuard,
  TokenJwtAuthGuard,
} from '@dmr.is/modules/guards/auth'
import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import {
  AdvertPublicationDetailedDto,
  AdvertVersionEnum,
  GetPublicationsDto,
  GetPublicationsQueryDto,
  UpdateAdvertPublicationDto,
} from '../../../models/advert-publication.model'
import { IPublicationService } from './publication.service.interface'

@UseGuards(TokenJwtAuthGuard, ScopesGuard)
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

  // TODO: Make this endpoint admin-only by adding RoleGuard and @Roles(UserRoleEnum.Admin)
  @Post('/adverts/:advertId')
  @LGResponse({ operationId: 'createAdvertPublication' })
  async createAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    await this.advertPublicationService.createAdvertPublication(advertId)
  }

  // TODO: Make this endpoint admin-only by adding RoleGuard and @Roles(UserRoleEnum.Admin)
  @Post(':publicationId/adverts/:advertId/publish')
  @LGResponse({ operationId: 'publishAdvertPublication' })
  async publishAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
  ): Promise<void> {
    await this.advertPublicationService.publishAdvertPublication(
      advertId,
      publicationId,
    )
  }

  // TODO: Make this endpoint admin-only by adding RoleGuard and @Roles(UserRoleEnum.Admin)
  @Patch('/:publicationId/adverts/:advertId')
  @LGResponse({ operationId: 'updateAdvertPublication' })
  async updateAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
    @Param('publicationId', new UUIDValidationPipe()) publicationId: string,
    @Body() body: UpdateAdvertPublicationDto,
  ): Promise<void> {
    await this.advertPublicationService.updateAdvertPublication(
      advertId,
      publicationId,
      body,
    )
  }

  // TODO: Make this endpoint admin-only by adding RoleGuard and @Roles(UserRoleEnum.Admin)
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
}
