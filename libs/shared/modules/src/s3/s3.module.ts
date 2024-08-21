import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { S3Service } from './s3.service'
import { IS3Service } from './s3.service.interface'

@Module({
  imports: [LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IS3Service,
      useClass: S3Service,
    },
  ],
  exports: [IS3Service],
})
export class S3Module {}
