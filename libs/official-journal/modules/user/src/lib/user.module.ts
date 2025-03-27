import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserModel } from './models/user.model'
import { UserInvolvedPartiesModel } from './models/user-involved-parties.model'
import { UserRoleModel } from './models/user-role.model'
import { UserService } from './user.service'
import { IUserService } from './user.service.interface'
import { AdvertInvolvedPartyModel } from '@dmr.is/official-journal/modules/journal'

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
