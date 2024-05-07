import { ApplicationModule, HealthController } from '@dmr.is/modules'
import { Module } from '@nestjs/common'
import { ApplicationController } from './application/application.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { SequelizeConfigService } from '@dmr.is/db'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
  ],
  controllers: [HealthController, ApplicationController],
  providers: [],
})
export class AppModule {}
