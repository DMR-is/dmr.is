import { forwardRef, Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'
import { AwsModule } from '@dmr.is/shared-modules'

import { UserModule } from '../user/user.module'
import { UtilityModule } from '../utility/utility.module'
import { PdfController } from './pdf.controller'
import { PdfService } from './pdf.service'
import { IPdfService } from './pdf.service.interface'

export { IPdfService }

@Module({
  // UserModule is here for RoleGuard on the case routes, which resolves the
  // caller against the staff user table via IUserService.
  // `forwardRef` because UtilityModule reaches back here:
  // utility -> application -> case -> pdf. Entering the cycle at
  // utility (pdf.service.ts imports IUtilityService from it) leaves
  // UtilityModule mid-evaluation when this array is built.
  imports: [
    LoggingModule,
    forwardRef(() => UtilityModule),
    AwsModule,
    UserModule,
  ],
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
