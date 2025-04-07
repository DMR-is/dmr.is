import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/models'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { InstitutionController } from './controllers/institution.controller'
import { InstitutionService } from './institution.service'
import { IInstitutionService } from './institution.service.interface'

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
