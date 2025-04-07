import {
  AdvertInvolvedPartyModel,
  UserInvolvedPartiesModel,
  UserModel,
  UserRoleModel,
} from '@dmr.is/official-journal/models'

import { Global, Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

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
