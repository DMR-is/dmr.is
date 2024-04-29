import { HealthModule } from '@dmr.is/modules'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { SequelizeConfigService } from '../sequelizeConfig.service'
import { JournalModule } from './journal/journal.module'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    JournalModule,
    HealthModule,
  ],
})
export class AppModule {}
