import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApiKeyModel } from '@dmr.is/doe-shared'

import { CompanyEventCoreModule } from '../company-event/company-event.core.module'
import { ApiKeyService } from './api-key.service'
import { IApiKeyService } from './api-key.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ApiKeyModel]), CompanyEventCoreModule],
  providers: [
    {
      provide: IApiKeyService,
      useClass: ApiKeyService,
    },
  ],
  exports: [IApiKeyService],
})
export class ApiKeyCoreModule {}
