import { forwardRef, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AwsModule } from '@dmr.is/modules'

import { AdvertPublicationModel } from '../advert-publications/advert-publication.model'
import { PdfService } from './pdf.service'

@Module({
  imports: [SequelizeModule.forFeature([AdvertPublicationModel]), AwsModule],
  controllers: [],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
