import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UserModel } from './models/user.model'
import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([UserModel])],
  providers: [
    {
      provide: IUserService,
      useClass: UserService,
    },
  ],
  exports: [IUserService],
})
export class UserCoreModule {}
