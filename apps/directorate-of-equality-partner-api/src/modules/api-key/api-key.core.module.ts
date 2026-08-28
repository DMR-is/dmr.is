import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApiKeyModel } from '@dmr.is/doe-shared'

import { ApiKeyVerifyService } from './api-key-verify.service'
import { IApiKeyVerifyService } from './api-key-verify.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ApiKeyModel])],
  providers: [
    {
      provide: IApiKeyVerifyService,
      useClass: ApiKeyVerifyService,
    },
  ],
  exports: [IApiKeyVerifyService],
})
export class ApiKeyCoreModule {}
