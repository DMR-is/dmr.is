import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { models as attachmentModels } from './models'
import { S3Service } from './s3.service'
import { IS3Service } from './s3.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([...attachmentModels]), LoggingModule],
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
