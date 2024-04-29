import { ApplicationModule, HealthController } from '@dmr.is/modules'
import { Module } from '@nestjs/common'
import { ApplicationController } from './application/application.controller'

@Module({
  imports: [ApplicationModule],
  controllers: [HealthController, ApplicationController],
  providers: [],
})
export class AppModule {}
