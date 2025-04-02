import { CaseCommunicationStatusModel } from '@dmr.is/official-journal/models'
import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'
import { CommunicationStatusController } from './communication-status.controller'
import { ICommunicationStatusService } from './communication-status.service.interface'
import { CommunicationStatusService } from './communication-status.service'

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
