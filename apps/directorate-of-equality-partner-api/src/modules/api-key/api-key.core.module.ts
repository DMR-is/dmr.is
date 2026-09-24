import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import {
  PartnerClientCoreModule,
  PartnerClientKeyModel,
  PartnerClientModel,
} from '@dmr.is/doe-modules/partner-client'
import { ApiKeyModel } from '@dmr.is/doe-shared'

import { ApiKeyVerifyService } from './api-key-verify.service'
import { IApiKeyVerifyService } from './api-key-verify.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      ApiKeyModel,
      PartnerClientKeyModel,
      PartnerClientModel,
    ]),
    // Re-exported for `PartnerCompanyGuard`, which resolves a vendor key's
    // delegation. Every module that uses the guard already imports this one.
    PartnerClientCoreModule,
  ],
  providers: [
    {
      provide: IApiKeyVerifyService,
      useClass: ApiKeyVerifyService,
    },
  ],
  exports: [IApiKeyVerifyService, PartnerClientCoreModule],
})
export class ApiKeyCoreModule {}
