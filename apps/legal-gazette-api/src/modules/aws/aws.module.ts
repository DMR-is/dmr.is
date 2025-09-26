import { Module } from '@nestjs/common'

import { SESService } from './services/ses/ses.service'
import { ISESService } from './services/ses/ses.service.interface'

@Module({
  providers: [
    {
      provide: ISESService,
      useClass: SESService,
    },
  ],
  exports: [ISESService],
})
export class AWSModule {}
