import { Module } from '@nestjs/common'

import { UsersController } from './users.controller'
import { UsersProviderModule } from './users.provider.module'

@Module({
  imports: [UsersProviderModule],
  controllers: [UsersController],
})
export class UserControllerModule {}
