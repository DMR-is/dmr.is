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
import { ICaseTypeService } from './case-type.service.interface'
import {
  ApiNoContentResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import {
  CreateCaseTypeDto,
  GetCaseTypeDto,
  GetCaseTypesDto,
  UpdateCaseTypeDto,
} from './dto/case-type.dto'

@Controller({ path: 'types', version: '1' })
@ApiTags('Case Types')
export class CaseTypeController {
  constructor(
    @Inject(ICaseTypeService)
    private readonly caseTypeService: ICaseTypeService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getTypes' })
  @ApiResponse({ status: 200, type: GetCaseTypesDto })
  async getCaseTypes(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypes()
  }

  @Get('/detailed')
  @ApiOperation({ operationId: 'getTypes' })
  @ApiResponse({ status: 200, type: GetCaseTypesDto })
  async getCaseTypesDetailed(): Promise<GetCaseTypesDto> {
    return this.caseTypeService.getCaseTypesDetailed()
  }

  @Post()
  @ApiOperation({ operationId: 'createType' })
  @ApiResponse({ status: 201, type: GetCaseTypeDto })
  async createCaseType(
    @Body() body: CreateCaseTypeDto,
  ): Promise<GetCaseTypeDto> {
    return this.caseTypeService.createCaseType(body)
  }

  @Put(':id')
  @ApiOperation({ operationId: 'updateType' })
  @ApiResponse({ status: 200, type: GetCaseTypeDto })
  async updateCaseType(
    @Param('id') id: string,
    @Body() body: UpdateCaseTypeDto,
  ): Promise<GetCaseTypeDto> {
    return this.caseTypeService.updateCaseType(id, body)
  }

  @Delete(':id')
  @ApiOperation({ operationId: 'deleteType' })
  @ApiNoContentResponse()
  async deleteCaseType(@Param('id') id: string): Promise<void> {
    return this.caseTypeService.deleteCaseType(id)
  }
}
