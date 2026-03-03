import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { ThrottlerGuard } from '@nestjs/throttler'

import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { LGResponse } from '../../../core/decorators/lg-response.decorator'
import { MachineClientGuard } from '../../../core/guards/machine-client.guard'
import { ForeclosureDto } from '../../../models/foreclosure.model'
import { ForeclosurePropertyDto } from '../../../models/foreclosure-property.model'
import { CreateForeclosureSaleDto } from './dto/foreclosure.dto'
import { IForeclosureService } from './foreclosure.service.interface'

@Controller({
  path: 'foreclosures',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, MachineClientGuard, ThrottlerGuard)
// We can set different throttling limits for different endpoints if needed
// Example: 5000 requests per hour
// @Throttle({ default: { limit: 5000, ttl: 3600000 } })
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
    type: ForeclosureDto,
    status: 201,
    description:
      'Creates a new foreclosure advertisement along with its properties',
  })
  async createForeclosureSale(
    @Body() body: CreateForeclosureSaleDto,
  ): Promise<ForeclosureDto> {
    return this.foreclosureService.createForeclosureSale(body)
  }

  @Delete('/sale/:id')
  @LGResponse({
    status: 204,
    operationId: 'deleteForeclosureSale',
    description:
      'Deletes a foreclosure sale by its ID, marks the advert as withdrawn',
  })
  @ApiParam({ name: 'id', description: 'The ID of the foreclosure sale' })
  async deleteForeclosureSale(@Param('id') id: string): Promise<void> {
    return this.foreclosureService.deleteForclosureSale(id)
  }

  @Post('/sale/:id/property')
  @LGResponse({
    operationId: 'createForeclosureProperty',
    description: 'Creates a new property for an existing foreclosure sale',
    type: ForeclosurePropertyDto,
    status: 201,
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
    status: 204,
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
