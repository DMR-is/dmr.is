import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { UserModel } from './models/user.model'
import { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import { UserRoleModel } from './models/user-role.model'
import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

export { IUserService } from './user.service.interface'
export { UserController } from './user.controller'

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      UserRoleModel,
      UserInvolvedPartiesModel,
      AdvertInvolvedPartyModel,
    ]),
    LoggingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: IUserService,
      useClass: UserService,
    },
  ],
  exports: [IUserService],
})
export class UserModule {}
