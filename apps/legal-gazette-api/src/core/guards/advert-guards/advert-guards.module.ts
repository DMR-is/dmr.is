import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { AdvertGuardUtils } from './advert-guard-utils.module'
import { CanEditGuard } from './can-edit.guard'
import { CanEditOrPublishGuard } from './can-edit-or-publish.guard'
import { CanPublishGuard } from './can-publish.guard'
import { CanPublishBulkGuard } from './can-publish-bulk.guard'

/**
 * Module that provides advert-related guards for authorization.
 *
 * Guards included:
 * - CanEditGuard: Validates if user can edit an advert (requires assignment)
 * - CanPublishGuard: Validates if advert can be published (status-based)
 * - CanPublishBulkGuard: Validates multiple adverts can be published
 * - CanEditOrPublishGuard: Validates if user can edit OR advert can be published
 *
 * All guards support nested resource resolution (e.g., publicationId → advertId)
 *
 * Usage:
 * Import this module in your controller module to use these guards.
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [AdvertGuardsModule],
 *   controllers: [MyController],
 * })
 * export class MyModule {}
 * ```
 */
/**
 * Hoisted so the SAME dynamic-module object is both imported and exported.
 *
 * Nest 10 keys module deduplication on a hash of the module metadata, which lets
 * `exports: [SequelizeModule]` resolve back to the inline `forFeature(...)` call
 * above it. Nest 11 keys on object *reference*, so the bare class is a different
 * module than the dynamic instance and the container refuses to boot with:
 * "Nest cannot export a provider/module that is not a part of the currently
 * processed module (AdvertGuardsModule)".
 */
const advertGuardModels = SequelizeModule.forFeature([
  AdvertModel,
  AdvertPublicationModel,
])

@Module({
  imports: [advertGuardModels, LoggingModule],
  providers: [
    AdvertGuardUtils,
    CanEditGuard,
    CanPublishGuard,
    CanPublishBulkGuard,
    CanEditOrPublishGuard,
  ],
  exports: [
    // Re-export the imported instance so model providers reach consumers.
    advertGuardModels,
    AdvertGuardUtils,
    CanEditGuard,
    CanPublishGuard,
    CanPublishBulkGuard,
    CanEditOrPublishGuard,
  ],
})
export class AdvertGuardsModule {}
