import { Module } from '@nestjs/common'

import { AWSService } from './aws.service'
import { IAWSService } from './aws.service.interface'

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: IAWSService,
      useClass: AWSService,
    },
  ],
  exports: [IAWSService],
})
export class AWSModule {}
