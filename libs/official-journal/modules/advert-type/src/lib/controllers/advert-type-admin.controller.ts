import { Sequelize } from 'sequelize-typescript'
import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
import { TokenJwtAuthGuard } from '@dmr.is/shared/guards/token-auth.guard'

import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { IAdvertTypeService } from '../advert-type.service.interface'
import { AdvertTypeError } from '../advert-type-error'
import { CreateAdvertMainTypeBody } from '../dto/create-advert-main-type.dto'
import { CreateAdvertMainTypeBulk } from '../dto/create-advert-main-type-bulk.dto'
import { CreateAdvertTypeBody } from '../dto/create-advert-type.dto'
import { GetAdvertMainType } from '../dto/get-advert-main-type.dto'
import { GetAdvertType } from '../dto/get-advert-type.dto'
import { UpdateAdvertTypeBody } from '../dto/update-advert-type.dto'
import { UpdateAdvertMainType } from '../dto/update-main-advert-type.dto'

@Controller({ path: 'types', version: '1' })
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class AdvertTypeAdminController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAdvertTypeService)
    private readonly advertTypeService: IAdvertTypeService,
    private sequelize: Sequelize,
  ) {}

  @Post('/main')
  @ApiOperation({ operationId: 'createMainType' })
  @ApiResponse({ status: 201, type: GetAdvertMainType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async createMainType(
    @Body() body: CreateAdvertMainTypeBody,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.createMainType(body)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Post('/main/bulk')
  @ApiOperation({ operationId: 'createMainTypesBulk' })
  @ApiCreatedResponse()
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async createMainTypesBulk(
    @Body() body: CreateAdvertMainTypeBulk,
  ): Promise<void> {
    const transaction = await this.sequelize.transaction()
    const promises = body.mainTypes.map((item) =>
      this.advertTypeService.createMainType(item, transaction),
    )

    const bulkResults = await Promise.all(promises)

    const errors = bulkResults.filter((result) => !result.result.ok)
    if (errors.length > 0) {
      await transaction.rollback()

      throw new AdvertTypeError('Ekki tókst að búa til allar tegundir', 500)
    }

    await transaction.commit()
  }

  @Put('/main/:id')
  @ApiOperation({ operationId: 'updateMainType' })
  @ApiResponse({ status: 200, type: GetAdvertMainType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async updateMainType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertMainType,
  ): Promise<GetAdvertMainType> {
    const results = await this.advertTypeService.updateMainType(id, body)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Delete('/main/:id')
  @ApiOperation({ operationId: 'deleteMainType' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async deleteMainType(@Param('id') id: string): Promise<void> {
    const results = await this.advertTypeService.deleteMainType(id)

    if (!results.result.ok) {
      throw new AdvertTypeError(
        results.result.error.message,
        results.result.error.code,
      )
    }
  }

  @Put('/:id')
  @ApiOperation({ operationId: 'updateType' })
  @ApiResponse({ status: 200, type: GetAdvertType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async updateType(
    @Param('id') id: string,
    @Body() body: UpdateAdvertTypeBody,
  ): Promise<GetAdvertType> {
    const result = await this.advertTypeService.updateType(id, body)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteType' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 404, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async deleteType(@Param('id') id: string): Promise<void> {
    const result = await this.advertTypeService.deleteType(id)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }
  }

  @Post()
  @ApiOperation({ operationId: 'createType' })
  @ApiResponse({ status: HttpStatus.CREATED, type: GetAdvertType })
  @ApiResponse({ status: 400, type: AdvertTypeError })
  @ApiResponse({ status: 500, type: AdvertTypeError })
  async createType(@Body() body: CreateAdvertTypeBody): Promise<GetAdvertType> {
    const result = await this.advertTypeService.createType(body)

    if (!result.result.ok) {
      throw new AdvertTypeError(
        result.result.error.message,
        result.result.error.code,
      )
    }

    return result.result.value
  }
}
