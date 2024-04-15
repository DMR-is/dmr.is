import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { JournalModule } from './app/journal.module'
import { SequelizeConfigService } from './sequelizeConfig.service'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    JournalModule,
  ],
})
export class AppModule {}
