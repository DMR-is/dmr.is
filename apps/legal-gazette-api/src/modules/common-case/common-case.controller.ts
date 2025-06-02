import { Body, Controller, Post } from '@nestjs/common'

import { CreateCommonCaseDto } from './dto/common-case.dto'

@Controller({ path: 'cases/common', version: '1' })
export class CommonCaseController {
  constructor() {}

  @Post('')
  async createCommonCase(@Body() body: CreateCommonCaseDto) {}
}
