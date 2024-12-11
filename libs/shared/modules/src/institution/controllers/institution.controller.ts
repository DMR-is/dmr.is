import { LogMethod } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  GetInstitution,
  GetInstitutions,
  InstitutionQuery,
} from '@dmr.is/shared/dto'

import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Query,
} from '@nestjs/common'
import { ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger'

import { IInstitutionService } from '../institution.service.interface'

@Controller({
  version: '1',
  path: 'institutions',
})
export class InstitutionController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IInstitutionService)
    private readonly institutionService: IInstitutionService,
  ) {}

  @Get('/:id')
  @ApiParam({ type: String, name: 'id' })
  @ApiResponse({
    status: 200,
    type: GetInstitution,
  })
  async getInstitution(@Param('id') id: string) {
    const results = await this.institutionService.getInstitution(id)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Get()
  @ApiQuery({
    type: InstitutionQuery,
    required: false,
  })
  @ApiResponse({
    status: 200,
    type: GetInstitutions,
  })
  @LogMethod()
  async getInstitutions(@Query() query: InstitutionQuery) {
    const results = await this.institutionService.getInstitutions(query)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }
}
