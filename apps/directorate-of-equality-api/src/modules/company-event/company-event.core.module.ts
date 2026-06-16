import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CompanyEventModel } from '../company/models/company-event.model'
import { CompanyEventService } from './company-event.service'
import { ICompanyEventService } from './company-event.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([CompanyEventModel])],
  providers: [
    {
      provide: ICompanyEventService,
      useClass: CompanyEventService,
    },
  ],
  exports: [ICompanyEventService],
})
export class CompanyEventCoreModule {}
