import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { models as attachmentModels } from './models'

@Module({
  imports: [SequelizeModule.forFeature([...attachmentModels]), LoggingModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class AttachmentsModule {}
