import { DynamicModule, Module } from '@nestjs/common'

import { DMRSequelizeConfig, IDMRSequelizeConfig } from './sequelize.config'
import { DMRSequelizeConfigService } from './sequelizeConfig.service'

@Module({})
export class DMRSequelizeConfigModule {
  static register(config: DMRSequelizeConfig): DynamicModule {
    return {
      module: DMRSequelizeConfigModule,
      global: true,
      providers: [
        {
          provide: IDMRSequelizeConfig,
          useValue: config,
        },
        DMRSequelizeConfigService,
      ],
      exports: [DMRSequelizeConfigService],
    }
  }
}
