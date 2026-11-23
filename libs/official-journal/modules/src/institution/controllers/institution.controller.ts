import {
  Controller,
  Get,
  HttpException,
  Inject,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'

import { UserRoleEnum } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { type Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { GetInstitutions, InstitutionQuery } from '@dmr.is/shared-dto'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { RoleGuard, StaffTokenGuard } from '../../guards/auth'
import { IInstitutionService } from '../institution.service.interface'

/**
 * Institution reads for the editorial web. This controller is mounted on the
 * admin API, which is internet-facing, and had no guard. It now takes the
 * same Admin stack as `InstitutionAdminController` and `CaseController`: the
 * editorial web signs in only `ritstjori` (Admin) users, so no other role
 * ever calls it.
 */
@Controller({
  version: '1',
  path: 'institutions',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, StaffTokenGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class InstitutionController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IInstitutionService)
    private readonly institutionService: IInstitutionService,
  ) {}

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
