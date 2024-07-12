import { Injectable } from '@nestjs/common'
import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize'

// import { CustomLogger, LOGGER_PROVIDER } from '@dmr.is/logging'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dbConfig from './sequelize.config.js'
import { getOptions } from './sequelize'

@Injectable()
export class SequelizeConfigService implements SequelizeOptionsFactory {
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
