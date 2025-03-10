import { LoggingModule } from '@dmr.is/logging'

import { Module } from '@nestjs/common'

import { UserModel } from './models/user.model'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { IUserService } from './user.service.interface'

@Module({
  imports: [UserModel, LoggingModule],
  controllers: [UserController],
  providers: [
    {
      provide: IUserService,
      useClass: UserService,
    },
  ],
  exports: [],
})
export class UserModule {}
