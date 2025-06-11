import { Controller, Get, Inject } from '@nestjs/common'

import { LGResponse } from '@dmr.is/legal-gazette/decorators'

import { GetTypesDto } from './dto/type.dto'
import { ITypeService } from './type.service.interface'

@Controller({ path: 'types', version: '1' })
export class TypeController {
  constructor(
    @Inject(ITypeService)
    private readonly typeService: ITypeService,
  ) {}

  @Get()
  @LGResponse({ operationId: 'getTypes', type: GetTypesDto })
  async getCaseTypes(): Promise<GetTypesDto> {
    return this.typeService.getTypes()
  }
}
