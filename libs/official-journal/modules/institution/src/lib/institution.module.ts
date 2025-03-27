import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { InstitutionService } from './institution.service'
import { IInstitutionService } from './institution.service.interface'
import { InstitutionModel } from '@dmr.is/official-journal/models'

export { InstitutionController } from './controllers/institution.controller'
export { InstitutionAdminController } from './controllers/institution-admin.controller'

@Module({
  imports: [SequelizeModule.forFeature([InstitutionModel])],
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
