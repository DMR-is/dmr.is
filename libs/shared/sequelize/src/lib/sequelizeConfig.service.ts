import { Inject, Injectable } from '@nestjs/common'
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize'

import { getOptions } from './sequelize'
import { DMRSequelizeConfig, IDMRSequelizeConfig } from './sequelize.config'

@Injectable()
export class DMRSequelizeConfigService implements SequelizeOptionsFactory {
  constructor(
    @Inject(IDMRSequelizeConfig)
    private readonly config: DMRSequelizeConfig,
  ) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      ...this.config,
      ...getOptions(),
      dialect: 'postgres',
      autoLoadModels: true,
    }
  }
}
