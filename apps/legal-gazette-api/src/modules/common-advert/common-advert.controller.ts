import { Body, Controller, Post } from '@nestjs/common'

import { CreateCommonAdvertDto } from './dto/common-advert.dto'

@Controller({ path: 'adverts/t/common', version: '1' })
export class CommonAdvertController {
  @Post('')
  async createCommonCase(@Body() body: CreateCommonAdvertDto) {}
}
