import { Module } from '@nestjs/common'

import { SignatureController } from './signature.controller'
import { SignatureProviderModule } from './signature.provider.module'

@Module({
  imports: [SignatureProviderModule],
  controllers: [SignatureController],
  providers: [],
  exports: [],
})
export class SignatureControllerModule {}
