import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Query,
} from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { GetInstitution } from '../dto/get-institution-response.dto'
import { InstitutionQuery } from '../dto/get-institutions-query.dto'
import { GetInstitutions } from '../dto/get-institutions-response.dto'
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
  @ApiOperation({ operationId: 'getInstitution' })
  @ApiResponse({ status: 200, type: GetInstitution })
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
  @ApiOperation({ operationId: 'getInstitutions' })
  @ApiResponse({ status: 200, type: GetInstitutions })
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
