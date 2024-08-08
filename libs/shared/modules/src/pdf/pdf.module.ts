import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { UtilityModule } from '../utility/utility.module'
import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

export { IPdfService }

@Module({
  imports: [LoggingModule, UtilityModule],
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
