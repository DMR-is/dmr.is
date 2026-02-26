import { Controller, Get, Inject, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { GetNationalRegistryEntityDto } from '@dmr.is/clients-national-registry'
import { NationalIdValidationPipe } from '@dmr.is/pipelines'
import { TokenJwtAuthGuard } from '@dmr.is/shared-modules'

import { AdminAccess } from '../../core/decorators'
import { LGResponse } from '../../core/decorators/lg-response.decorator'
import { AuthorizationGuard } from '../../core/guards/authorization.guard'
import { ApplicationWebScopes } from '../../core/guards/scope-guards/scopes.decorator'
import { ILGNationalRegistryService } from './national-registry.service.interface'

@Controller({
  path: 'national-registry',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, AuthorizationGuard)
@AdminAccess()
@ApplicationWebScopes()
export class LGNationalRegistryController {
  constructor(
    @Inject(ILGNationalRegistryService)
    private nationalRegistryService: ILGNationalRegistryService,
  ) {}

  @Get('/entity/:nationalId')
  @LGResponse({
    operationId: 'getEntityByNationalId',
    type: GetNationalRegistryEntityDto,
  })
  getEntityByNationalId(
    @Param('nationalId', new NationalIdValidationPipe()) nationalId: string,
  ) {
    return this.nationalRegistryService.getEntityByNationalId(nationalId)
  }
}
