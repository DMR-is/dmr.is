import { createNamespace } from 'cls-hooked'
import { Sequelize } from 'sequelize-typescript'

import { Inject, Injectable } from '@nestjs/common'
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'

import { getOptions } from './sequelize'
import { DMRSequelizeConfig, IDMRSequelizeConfig } from './sequelize.config'

const LOGGING_CONTEXT = 'SequelizeConfigService'

@Injectable()
export class DMRSequelizeConfigService implements SequelizeOptionsFactory {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
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
      autoLoadModels: config.autoLoadModels ?? true,
      logging: config.debugLog
        ? (sql: string) => {
            const query = sql.split(':')[1]
            this.logger.debug(`Query executed`, {
              sql: query,
              context: LOGGING_CONTEXT,
            })
            this.logger.debug(query)
          }
        : false,
    }
  }
}
