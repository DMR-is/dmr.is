import { CaseModel } from '@dmr.is/official-journal/models'
import { ApplicationModule } from '@dmr.is/shared/modules/application'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseModel]), ApplicationModule],
  controllers: [PdfController],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfModule {}
