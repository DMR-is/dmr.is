import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'
import { ICaseTypeService } from './case-type.service.interface'

@Controller({ path: 'types', version: '1' })
@ApiTags('Case Types')
export class CaseTypeController {
  constructor(
    @Inject(ICaseTypeService)
    private readonly caseTypeService: ICaseTypeService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getTypes', type: GetCaseTypesDto })
  async getCaseTypes(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypes()
  }

  @Get('detailed')
  @LGResponse({ operationId: 'getTypesDetailed', type: GetCaseTypesDto })
  async getCaseTypesDetailed(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypesDetailed()
  }

  @Post()
  @LGResponse({ operationId: 'createType', status: 201, type: GetCaseTypeDto })
  async createCaseType(
    @Body() body: CreateCaseTypeDto,
  ): Promise<GetCaseTypeDto> {
    return this.caseTypeService.createCaseType(body)
  }

  @Put(':id')
  @LGResponse({ operationId: 'updateType', type: GetCaseTypeDto })
  async updateCaseType(
    @Param('id') id: string,
    @Body() body: UpdateCaseTypeDto,
  ): Promise<GetCaseTypeDto> {
    return this.caseTypeService.updateCaseType(id, body)
  }

  @Delete(':id')
  @LGResponse({ operationId: 'deleteType', type: GetCaseTypeDto })
  async deleteCaseType(@Param('id') id: string): Promise<GetCaseTypeDto> {
    return this.caseTypeService.deleteCaseType(id)
  }
}
