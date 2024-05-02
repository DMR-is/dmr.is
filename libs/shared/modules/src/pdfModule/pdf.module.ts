import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

@Module({
  imports: [LoggingModule],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfModule {}
