import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { UserModel } from './models/user.model'
import { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import { UserRoleModel } from './models/user-role.model'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

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
  controllers: [UserController],
  providers: [
    {
      provide: IUserService,
      useClass: UserService,
    },
  ],
  exports: [IUserService],
})
export class UserModule {}
