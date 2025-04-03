import { Global, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

import {
  UserModel,
  UserRoleModel,
  UserInvolvedPartiesModel,
  AdvertInvolvedPartyModel,
} from '@dmr.is/official-journal/models'
import { UserController } from './user.controller'

@Global()
@Module({
  imports: [
    SequelizeModule.forFeature([
      UserModel,
      UserRoleModel,
      UserInvolvedPartiesModel,
      AdvertInvolvedPartyModel,
    ]),
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
