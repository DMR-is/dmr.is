import { Module } from '@nestjs/common'

import { AwsModule } from '@dmr.is/shared-modules'

import { DoeMailService } from './doe-mail.service'
import { IDoeMailService } from './doe-mail.service.interface'

@Module({
  imports: [AwsModule],
  providers: [
    {
      provide: IDoeMailService,
      useClass: DoeMailService,
    },
  ],
  exports: [IDoeMailService],
})
export class DoeMailModule {}
