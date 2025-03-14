import { SequelizeConfigService } from '@dmr.is/db'
import { LogRequestMiddleware } from '@dmr.is/middleware'
import {
  AdvertTypeController,
  AdvertTypeModule,
  ApplicationModule,
  HealthModule,
  PdfModule,
  SignatureModule,
  UserModule,
  UtilityModule,
} from '@dmr.is/modules'

import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ApplicationController } from './application/application.controller'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
    SignatureModule,
    HealthModule,
    PdfModule,
    UtilityModule,
    AdvertTypeModule,
    UserModule,
  ],
  controllers: [ApplicationController, AdvertTypeController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogRequestMiddleware)
      .forRoutes({ path: '/**', method: RequestMethod.ALL })
  }
}
