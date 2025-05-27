import { Body, Controller, Inject, Post } from '@nestjs/common'

import { ICaseService } from './case.service.interface'

@Controller({ path: 'cases', version: '1' })
export class CaseController {
  constructor(
    @Inject(ICaseService) private readonly caseService: ICaseService,
  ) {}

  @Post()
  async create(@Body() body: any): Promise<void> {
    return this.caseService.create(body)
  }
}
