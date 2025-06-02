import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  CreateAdvertType,
  GetAdvertTypeDto,
  GetAdvertTypesDetailedDto,
  GetAdvertTypesDto,
  UpdateAdvertType,
} from './dto/advert-type.dto'
import { IAdvertTypeService } from './advert-type.service.interface'

@Controller({ path: 'types', version: '1' })
export class AdvertTypeController {
  constructor(
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getTypes', type: GetAdvertTypesDto })
  async getCaseTypes(): Promise<GetAdvertTypesDto> {
    return this.advertTypeService.getAdvertTypes()
  }

  @Get('detailed')
  @LGResponse({
    operationId: 'getTypesDetailed',
    type: GetAdvertTypesDetailedDto,
  })
  async getCaseTypesDetailed(): Promise<GetAdvertTypesDetailedDto> {
    return this.advertTypeService.getAdvertTypesDetailed()
  }

  @Post()
  @LGResponse({
    operationId: 'createType',
    status: 201,
    type: GetAdvertTypeDto,
  })
  async createCaseType(
    @Body() body: CreateAdvertType,
  ): Promise<GetAdvertTypeDto> {
    return this.advertTypeService.createAdvertType(body)
  }

  @Put(':id')
  @LGResponse({ operationId: 'updateType', type: GetAdvertTypeDto })
  async updateCaseType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertType,
  ): Promise<GetAdvertTypeDto> {
    return this.advertTypeService.updateAdvertType(id, body)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteType', type: GetAdvertTypeDto })
  async deleteCaseType(@Param('id') id: string): Promise<GetAdvertTypeDto> {
    return this.advertTypeService.deleteAdvertType(id)
  }
}
