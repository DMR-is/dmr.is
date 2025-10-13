import { Body, Controller, Delete, Inject, Param, Post } from '@nestjs/common'
import { ApiParam } from '@nestjs/swagger'

import { Get } from '@dmr.is/decorators'

import { LGResponse } from '../../decorators/lg-response.decorator'
import {
  CreateForeclosureSaleDto,
  ForeclosureDto,
  ForeclosurePropertyDto,
} from './dto/foreclosure.dto'
import { IForeclosureService } from './foreclosure.service.interface'

@Controller({
  path: 'foreclosures',
  version: '1',
})
export class ForeclosureController {
  constructor(
    @Inject(IForeclosureService)
    private readonly foreclosureService: IForeclosureService,
  ) {}

  @Get(':id')
  @LGResponse({
    operationId: 'getForeclosureById',
    type: ForeclosureDto,
    description: 'Get foreclosure by id',
  })
  async getForeclosureById(@Param('id') id: string): Promise<ForeclosureDto> {
    return this.foreclosureService.getForeclosureById(id)
  }

  @Post('/sale')
  @LGResponse({
    operationId: 'createForeclosureSale',
    type: 'void',
    description:
      'Creates a new foreclosure advertisement along with its properties',
  })
  async createForeclosureSale(
    @Body() body: CreateForeclosureSaleDto,
  ): Promise<ForeclosureDto> {
    return this.foreclosureService.createForeclosureSale(body)
  }

  @Post('/sale/:id/property')
  @LGResponse({
    operationId: 'createForeclosureProperty',
    type: 'void',
    description: 'Creates a new property for an existing foreclosure sale',
  })
  @ApiParam({ name: 'id', description: 'The ID of the foreclosure sale' })
  async createForeclosureProperty(
    @Param('id') id: string,
    @Body() body: CreateForeclosureSaleDto['properties'][0],
  ): Promise<ForeclosurePropertyDto> {
    return this.foreclosureService.createForeclosureProperty(id, body)
  }

  @Delete('/sale/:id/property/:propertyNumber')
  @LGResponse({
    operationId: 'deletePropertyFromForeclosure',
    description: 'Deletes a property from an existing foreclosure sale',
  })
  @ApiParam({ name: 'id', description: 'The ID of the foreclosure sale' })
  @ApiParam({
    name: 'propertyNumber',
    description: 'The property number of the property to delete (fastanúmer)',
  })
  async deletePropertyFromForeclosure(
    @Param('id') id: string,
    @Param('propertyNumber') propertyNumber: string,
  ): Promise<void> {
    return this.foreclosureService.deletePropertyFromForeclosure(
      id,
      propertyNumber,
    )
  }
}
