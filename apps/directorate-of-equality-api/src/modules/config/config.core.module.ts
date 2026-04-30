import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ConfigModel } from './models/config.model'
import { ConfigService } from './config.service'
import { IConfigService } from './config.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ConfigModel])],
  providers: [
    {
      provide: IConfigService,
      useClass: ConfigService,
    },
  ],
  exports: [IConfigService],
})
export class ConfigCoreModule {}
