import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { ReportModel } from '../report/models/report.model'
import { UserModel } from '../user/models/user.model'
import { AuthorizationService } from './authorization.service'
import { IAuthorizationService } from './authorization.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([ReportModel, UserModel])],
  providers: [
    {
      provide: IAuthorizationService,
      useClass: AuthorizationService,
    },
  ],
  exports: [IAuthorizationService],
})
export class AuthorizationCoreModule {}
