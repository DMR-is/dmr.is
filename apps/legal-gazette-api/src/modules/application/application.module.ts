import { Module } from '@nestjs/common'
import { LegalGazetteApplicationController } from './application.controller'
import { LegalGazetteApplicationService } from './application.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { ILegalGazetteApplicationService } from './application.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([])],
  controllers: [LegalGazetteApplicationController],
  providers: [
    {
      provide: ILegalGazetteApplicationService,
      useClass: LegalGazetteApplicationService,
    },
  ],
  exports: [ILegalGazetteApplicationService],
})
export class LegalGazetteApplicationModule {}
