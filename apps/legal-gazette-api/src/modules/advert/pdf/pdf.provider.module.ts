import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/shared-modules'

import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { PdfService } from './pdf.service'

@Module({
  imports: [SequelizeModule.forFeature([AdvertPublicationModel]), AwsModule],
  controllers: [],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfProviderModule {}
