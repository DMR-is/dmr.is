import { Module } from '@nestjs/common'

import { CompanyCoreModule } from '@dmr.is/doe-modules/company'
import { ScoringModelCoreModule } from '@dmr.is/doe-modules/scoring-model'

import { ApiKeyCoreModule } from '../api-key/api-key.core.module'
import { ScoringModelController } from './scoring-model.controller'

/**
 * Notably absent: `ApplicationCoreModule`. Authoring a scoring model touches
 * none of the submission pipeline, so this surface does not boot it.
 */
@Module({
  imports: [ScoringModelCoreModule, CompanyCoreModule, ApiKeyCoreModule],
  controllers: [ScoringModelController],
})
export class ScoringModelApiModule {}
