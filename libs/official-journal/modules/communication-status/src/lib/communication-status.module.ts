import { CaseCommunicationStatusModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CommunicationStatusController } from './communication-status.controller'
import { CommunicationStatusService } from './communication-status.service'
import { ICommunicationStatusService } from './communication-status.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CaseCommunicationStatusModel])],
  controllers: [CommunicationStatusController],
  providers: [
    {
      provide: ICommunicationStatusService,
      useClass: CommunicationStatusService,
    },
  ],
  exports: [ICommunicationStatusService],
})
export class CommunicationStatusModule {}
