import {
  Controller,
  Get,
  Inject,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ICaseService } from './case.service.interface'
import { Roles } from '@dmr.is/decorators'
import {
  GetCaseResponse,
  GetCasesReponse,
  GetCasesQuery,
} from '@dmr.is/official-journal/dto/case/case.dto'
import { UUIDValidationPipe } from '@dmr.is/pipelines'
import { ResultWrapper } from '@dmr.is/types'
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { UserRoleEnum } from '@dmr.is/constants'
import { TokenJwtAuthGuard } from '@dmr.is/official-journal/guards'
import { RoleGuard } from '@dmr.is/official-journal/modules/user'
@Controller({
  path: 'cases',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(TokenJwtAuthGuard, RoleGuard)
@Roles(UserRoleEnum.Admin)
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}

  @Get(':id')
  @ApiOperation({ operationId: 'getCase' })
  @ApiResponse({ status: 200, type: GetCaseResponse })
  async getCase(
    @Param('id', new UUIDValidationPipe()) id: string,
  ): Promise<GetCaseResponse> {
    return ResultWrapper.unwrap(await this.caseService.getCase(id))
  }

  @Get()
  @ApiOperation({ operationId: 'getCases' })
  @ApiResponse({ status: 200, type: GetCasesReponse })
  async getCases(@Query() params?: GetCasesQuery): Promise<GetCasesReponse> {
    return ResultWrapper.unwrap(await this.caseService.getCases(params))
  }
}
