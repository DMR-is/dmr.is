import { createNamespace } from 'cls-hooked'
import { Sequelize } from 'sequelize-typescript'

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
    const { clsNamespace, ...config } = this.config

    if (clsNamespace) {
      const namespace = createNamespace(clsNamespace)
      Sequelize.useCLS(namespace)
    }

    return {
      ...config,
      ...getOptions(),
      dialect: 'postgres',
      autoLoadModels: true,
    }
  }
}
