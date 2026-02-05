import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

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
    AwsModule,
  ],
  exports: [IAWSService],
})
export class AwsModule {}
