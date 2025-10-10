import { Module } from '@nestjs/common'

import { ForeclosureController } from './foreclosure.controller'
import { ForeclosureService } from './foreclosure.service'
import { IForeclosureService } from './foreclosure.service.interface'

@Module({
  imports: [],
  controllers: [ForeclosureController],
  providers: [
    {
      provide: IForeclosureService,
      useClass: ForeclosureService,
    },
  ],
  exports: [IForeclosureService],
})
export class ForeclosureModule {}
