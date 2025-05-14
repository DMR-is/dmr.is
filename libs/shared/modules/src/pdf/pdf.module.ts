import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { AwsModule } from '../aws/aws'
import { UtilityModule } from '../utility/utility.module'
import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

export { IPdfService }

@Module({
  imports: [LoggingModule, UtilityModule, AwsModule],
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
