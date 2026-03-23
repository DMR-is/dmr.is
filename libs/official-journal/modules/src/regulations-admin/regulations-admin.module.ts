import { Module } from '@nestjs/common'

import { LoggingModule } from '@dmr.is/logging'

import { AuthModule } from '../auth/auth.module'
import { RegulationsAdminService } from './regulations-admin.service'
import { IRegulationsAdminService } from './regulations-admin.service.interface'

@Module({
  imports: [LoggingModule, AuthModule],
  providers: [
    {
      provide: IRegulationsAdminService,
      useClass: RegulationsAdminService,
    },
  ],
  exports: [IRegulationsAdminService],
})
export class RegulationsAdminModule {}
