import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { EnumValidationPipe, UUIDValidationPipe } from '@dmr.is/pipelines'

import { LGResponse } from '../../decorators/lg-response.decorator'
import { AdvertVersionEnum } from '../advert/advert.model'
import { UpdateAdvertPublicationDto } from './dto/advert-publication.dto'
import { AdvertPublicationDetailedDto } from './dto/advert-publication-detailed.dto'
import { IAdvertPublicationService } from './advert-publication.service.interface'

@Controller({
  path: 'adverts/:advertId/publications',
  version: '1',
})
export class AdvertPublicationController {
  constructor(
    @Inject(IAdvertPublicationService)
    readonly advertPublicationService: IAdvertPublicationService,
  ) {}

  @Get(':version')
  @ApiParam({
    name: 'version',
    enum: AdvertVersionEnum,
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

  @Post('')
  @LGResponse({ operationId: 'createAdvertPublication' })
  async createAdvertPublication(
    @Param('advertId', new UUIDValidationPipe()) advertId: string,
  ): Promise<void> {
    await this.advertPublicationService.createAdvertPublication(advertId)
  }

  @Post(':publicationId/publish')
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

  @Patch('/:publicationId')
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

  @Delete('/:publicationId')
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
