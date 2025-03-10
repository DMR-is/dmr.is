import { UserRole } from '@dmr.is/constants'
import { Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateInstitution,
  GetInstitution,
  UpdateInstitution,
} from '@dmr.is/shared/dto'

import {
  Body,
  Controller,
  Delete,
  HttpException,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger'

import { RoleGuard, TokenJwtAuthGuard } from '../../guards'
import { IInstitutionService } from '../institution.service.interface'

@Controller({
  version: '1',
  path: 'institutions',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRole.Admin)
export class InstitutionAdminController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IInstitutionService)
    private readonly institutionService: IInstitutionService,
  ) {}

  @Post('/')
  @ApiOperation({ operationId: 'createInstitution' })
  @ApiResponse({ status: 201, type: GetInstitution })
  async createInstitution(
    @Body() createInstitution: CreateInstitution,
  ): Promise<GetInstitution> {
    const results = await this.institutionService.createInstitution(
      createInstitution,
    )

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Put('/:id')
  @ApiOperation({ operationId: 'updateInstitution' })
  @ApiResponse({ status: 200, type: GetInstitution })
  async updateInstitution(
    @Param('id') id: string,
    @Body() updateInstitution: UpdateInstitution,
  ): Promise<GetInstitution> {
    const results = await this.institutionService.updateInstitution(
      id,
      updateInstitution,
    )

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }

    return results.result.value
  }

  @Delete('/:id')
  @ApiOperation({ operationId: 'deleteInstitution' })
  @ApiNoContentResponse()
  async deleteInstitution(@Param('id') id: string): Promise<void> {
    const results = await this.institutionService.deleteInstitution(id)

    if (!results.result.ok) {
      throw new HttpException(
        results.result.error.message,
        results.result.error.code,
      )
    }
  }
}
