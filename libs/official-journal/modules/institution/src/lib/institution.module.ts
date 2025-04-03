import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { InstitutionService } from './institution.service'
import { IInstitutionService } from './institution.service.interface'
import { InstitutionController } from './controllers/institution.controller'
import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'

@Module({
  imports: [SequelizeModule.forFeature([AdvertInvolvedPartyModel])],
  controllers: [InstitutionController],
  providers: [
    {
      provide: IInstitutionService,
      useClass: InstitutionService,
    },
  ],
  exports: [IInstitutionService],
})
export class InstitutionModule {}
