import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LegalGazetteApplicationController } from './application.controller'
import { LegalGazetteApplicationService } from './application.service'
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
