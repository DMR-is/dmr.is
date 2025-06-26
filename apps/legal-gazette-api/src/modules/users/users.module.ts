import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { UsersController } from './users.controller'
import { UserModel } from './users.model'
import { UsersService } from './users.service'
import { IUsersService } from './users.service.interface'

@Module({
  imports: [SequelizeModule.forFeature([UserModel])],
  controllers: [UsersController],
  providers: [
    {
      provide: IUsersService,
      useClass: UsersService,
    },
  ],
  exports: [IUsersService],
})
export class UsersModule {}
