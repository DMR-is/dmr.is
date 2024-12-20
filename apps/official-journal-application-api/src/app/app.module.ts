import {
  AdvertTypeController,
  AdvertTypeModule,
  ApplicationModule,
  ApplicationUserModule,
  HealthModule,
  PdfModule,
  SignatureModule,
  UtilityModule,
} from '@dmr.is/modules'
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { ApplicationController } from './application/application.controller'
import { SequelizeModule } from '@nestjs/sequelize'
import { SequelizeConfigService } from '@dmr.is/db'
import { LogRequestMiddleware } from '@dmr.is/middleware'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
    SignatureModule,
    HealthModule,
    PdfModule,
    ApplicationUserModule,
    UtilityModule,
    AdvertTypeModule,
  ],
  controllers: [ApplicationController, AdvertTypeController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LogRequestMiddleware)
      .forRoutes({ path: '/**', method: RequestMethod.ALL })
    // .apply(WithAuthMiddleware)
    // .exclude({
    //   method: RequestMethod.ALL,
    //   path: '/health',
    //   version: '1',
    // })
    // .forRoutes({ path: '/**', method: RequestMethod.ALL })
  }
}
