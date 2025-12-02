import { Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IAWSService } from '@dmr.is/modules'

import { LegacyMigrationTokenModel } from '../../models/legacy-migration-token.model'
import { LegacySubscriberModel } from '../../models/legacy-subscriber.model'
import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import {
  CheckLegacyEmailResult,
  ILegacyMigrationService,
} from './legacy-migration.service.interface'

/**
 * Service for handling legacy subscriber migration to the new system.
 *
 * This is a stub implementation for TDD - tests are written first,
 * implementation will be added in Phase 3.
 */
@Injectable()
export class LegacyMigrationService implements ILegacyMigrationService {
  constructor(
    @InjectModel(LegacySubscriberModel)
    private readonly legacySubscriberModel: typeof LegacySubscriberModel,
    @InjectModel(LegacyMigrationTokenModel)
    private readonly legacyMigrationTokenModel: typeof LegacyMigrationTokenModel,
    @InjectModel(SubscriberModel)
    private readonly subscriberModel: typeof SubscriberModel,
    @Inject(IAWSService)
    private readonly awsService: IAWSService,
  ) {}

  async checkLegacyEmail(_email: string): Promise<CheckLegacyEmailResult> {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented')
  }

  async requestMigration(
    _email: string,
    _targetNationalId: string,
  ): Promise<void> {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented')
  }

  async completeMigration(
    _token: string,
    _authenticatedNationalId: string,
  ): Promise<SubscriberDto> {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented')
  }

  async autoMigrateByKennitala(
    _nationalId: string,
  ): Promise<SubscriberDto | null> {
    // TODO: Implement in Phase 3
    throw new Error('Not implemented')
  }
}
