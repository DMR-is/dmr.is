import { ResultWrapper } from '@dmr.is/types'

import { Controller, Get, Inject } from '@nestjs/common'
import { ApiOperation, ApiResponse } from '@nestjs/swagger'

import { GetTagsResponse } from './dto/case-tag.dto'
import { ICaseTagService } from './case-tag.service.interface'

@Controller({
  path: 'tags',
  version: '1',
})
export class CaseTagController {
  constructor(
    @Inject(ICaseTagService) private readonly caseService: ICaseTagService,
  ) {}

  @Get()
  @ApiOperation({ operationId: 'getTags' })
  @ApiResponse({ status: 200, type: GetTagsResponse })
  async tags(): Promise<GetTagsResponse> {
    return ResultWrapper.unwrap(await this.caseService.getTags())
  }
}
