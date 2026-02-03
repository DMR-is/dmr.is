import { Module } from '@nestjs/common'
import { SequelizeModule } from '@nestjs/sequelize'

import { LoggingModule } from '@dmr.is/logging'

import { AdvertModel } from '../../../models/advert.model'
import { AdvertPublicationModel } from '../../../models/advert-publication.model'
import { CanEditGuard } from './can-edit.guard'
import { CanEditOrPublishGuard } from './can-edit-or-publish.guard'
import { CanPublishGuard } from './can-publish.guard'
import { CanPublishBulkGuard } from './can-publish-bulk.guard'
import { AdvertGuardUtils } from './utils'

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
@Module({
  imports: [
    SequelizeModule.forFeature([AdvertModel, AdvertPublicationModel]),
    LoggingModule,
  ],
  providers: [
    AdvertGuardUtils,
    CanEditGuard,
    CanPublishGuard,
    CanPublishBulkGuard,
    CanEditOrPublishGuard,
  ],
  exports: [
    // Re-export SequelizeModule so model providers are available to consumers
    SequelizeModule,
    AdvertGuardUtils,
    CanEditGuard,
    CanPublishGuard,
    CanPublishBulkGuard,
    CanEditOrPublishGuard,
  ],
})
export class AdvertGuardsModule {}
