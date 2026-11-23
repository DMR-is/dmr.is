import { forwardRef, Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'
import { AwsModule } from '@dmr.is/shared-modules'

import { UtilityModule } from '../utility/utility.module'
import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

export { IPdfService }

/**
 * The PDF service, with no routes. Import this to render PDFs; import
 * `PdfModule` only in an app that should serve the `/pdf` routes.
 */
@Module({
  // `forwardRef` because UtilityModule reaches back here:
  // utility -> application -> case -> pdf. Entering the cycle at
  // utility (pdf.service.ts imports IUtilityService from it) leaves
  // UtilityModule mid-evaluation when this array is built.
  imports: [LoggingModule, forwardRef(() => UtilityModule), AwsModule],
  providers: [
    {
      provide: IPdfService,
      useClass: PdfService,
    },
  ],
  exports: [IPdfService],
})
export class PdfServiceModule {}

/**
 * The `/pdf` routes. Mounted by the application API only, which serves the
 * application PDF to island.is.
 */
@Module({
  imports: [PdfServiceModule],
  controllers: [PdfController],
  exports: [PdfServiceModule],
})
export class PdfModule {}
