import { Module } from '@nestjs/common'

import { ApiKeyCoreModule } from '../api-key/api-key.core.module'
import { DelegationController } from './delegation.controller'

/** `ApiKeyCoreModule` supplies both the key verifier and the delegation lookup. */
@Module({
  imports: [ApiKeyCoreModule],
  controllers: [DelegationController],
})
export class DelegationApiModule {}
