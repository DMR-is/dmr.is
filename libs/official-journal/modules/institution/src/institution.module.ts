import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { InstitutionModel } from './models/institution.model'
import { InstitutionService } from './institution.service'
import { IInstitutionService } from './institution.service.interface'

export { InstitutionController } from './controllers/institution.controller'
export { InstitutionAdminController } from './controllers/institution-admin.controller'

@Module({
  imports: [SequelizeModule.forFeature([InstitutionModel]), LoggingModule],
  controllers: [],
  providers: [
    {
      provide: IInstitutionService,
      useClass: InstitutionService,
    },
  ],
  exports: [IInstitutionService],
})
export class InstitutionModule {}
