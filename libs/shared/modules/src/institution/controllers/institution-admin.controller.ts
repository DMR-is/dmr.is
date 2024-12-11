import { USER_ROLES } from '@dmr.is/constants'
import { LogMethod, Roles } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { CreateInstitution, GetInstitution } from '@dmr.is/shared/dto'

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
  ApiBody,
  ApiNoContentResponse,
  ApiParam,
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
export class InstitutionAdminController {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IInstitutionService)
    private readonly institutionService: IInstitutionService,
  ) {}

  @Roles(USER_ROLES.Admin)
  @Post('/')
  @ApiBody({
    type: CreateInstitution,
  })
  @ApiResponse({
    status: 201,
    type: GetInstitution,
  })
  @LogMethod()
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

  @Roles(USER_ROLES.Admin)
  @Put('/:id')
  @ApiBody({
    type: CreateInstitution,
  })
  @ApiResponse({
    status: 200,
    type: GetInstitution,
  })
  @LogMethod()
  async updateInstitution(
    @Param('id') id: string,
    @Body() createInstitution: CreateInstitution,
  ): Promise<GetInstitution> {
    const results = await this.institutionService.updateInstitution(
      id,
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

  @Roles(USER_ROLES.Admin)
  @Delete('/:id')
  @ApiParam({ type: String, name: 'id' })
  @ApiNoContentResponse()
  @LogMethod()
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
