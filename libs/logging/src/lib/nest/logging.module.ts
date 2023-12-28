import { Module } from '@nestjs/common'

import { logger } from '../logging'

export const LOGGER_PROVIDER = 'Logger'

@Module({
  providers: [{ provide: LOGGER_PROVIDER, useValue: logger }],
  exports: [{ provide: LOGGER_PROVIDER, useValue: logger }],
})
export class LoggingModule {}
