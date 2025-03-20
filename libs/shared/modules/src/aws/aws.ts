import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { AWSService } from './aws.service'
import { IAWSService } from './aws.service.interface'

@Module({
  imports: [LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IAWSService,
      useClass: AWSService,
    },
  ],
  exports: [IAWSService],
})
export class AwsModule {}
