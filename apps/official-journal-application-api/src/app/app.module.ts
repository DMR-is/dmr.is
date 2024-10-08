import {
  ApplicationModule,
  ApplicationUserModule,
  HealthModule,
  PdfModule,
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
import { LogRequestMiddleware, WithAuthMiddleware } from '@dmr.is/middleware'

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    ApplicationModule,
    HealthModule,
    PdfModule,
    ApplicationUserModule,
    UtilityModule,
  ],
  controllers: [ApplicationController],
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
