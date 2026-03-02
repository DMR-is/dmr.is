import { Module } from '@nestjs/common'

import { UserContext } from './user.context'

@Module({
  providers: [UserContext],
  exports: [UserContext],
})
export class UserContextModule {}
