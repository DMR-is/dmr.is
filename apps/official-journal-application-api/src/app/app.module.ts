import { ApplicationModule, HealthController } from '@dmr.is/modules'
import { Module } from '@nestjs/common'

@Module({
  imports: [ApplicationModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
