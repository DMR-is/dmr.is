import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { CaseModel } from '../case/case.model'
import { InstitutionModel } from '../institution/institution.model'
import { UserInstitutionModel } from '../users/user-institutions.model'
import { UserModel } from '../users/users.model'
import { CommonApplicationController } from './common-application.controller'
import { CommonApplicationService } from './common-application.service'
import { ICommonApplicationService } from './common-application.service.interface'

@Module({
  imports: [
    SequelizeModule.forFeature([
      CaseModel,
      UserModel,
      UserInstitutionModel,
      InstitutionModel,
    ]),
  ],
  controllers: [CommonApplicationController],
  providers: [
    {
      provide: ICommonApplicationService,
      useClass: CommonApplicationService,
    },
  ],
  exports: [ICommonApplicationService],
})
export class CommonApplicationModule {}
