import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ConfigModel } from './models/config.model'
import { ConfigController } from './config.controller'
import { ConfigService } from './config.service'
import { IConfigService } from './config.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ConfigModel])],
  controllers: [ConfigController],
  providers: [
    {
      provide: IConfigService,
      useClass: ConfigService,
    },
  ],
  exports: [IConfigService],
})
export class ConfigModule {}
