import { Module } from '@nestjs/common'

import { AppController } from './app.controller'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggingInterceptor } from '@dmr.is/shared/interceptors'
import { AppService } from './app.service'

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
