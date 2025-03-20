import { Injectable } from '@nestjs/common'
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize'

import { getOptions } from './sequelize'
// import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dbConfig from './sequelize.config.js'

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
  // @Inject(LOGGER_PROVIDER)
  // private logger: CustomLogger,

  createSequelizeOptions(): SequelizeModuleOptions {
    const env = process.env.NODE_ENV || 'development'
    const config = (dbConfig as { [key: string]: object })[env]
    const options = {
      ...config,
      ...getOptions(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any

    //options.username = 'foo'
    options.autoLoadModels = true
    return options
  }
}
