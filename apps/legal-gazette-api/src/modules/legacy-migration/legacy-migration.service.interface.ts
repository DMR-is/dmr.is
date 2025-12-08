import { SubscriberDto } from '../../models/subscriber.model'
import { CheckLegacyEmailResponseDto } from './legacy-migration.dto'

export interface ILegacyMigrationService {
  /**
   * Check if an email exists in the legacy subscriber table
   * @param email - The email to check
   * @returns Object indicating if email exists and if it has an associated kennitala
   */
  checkLegacyEmail(email: string): Promise<CheckLegacyEmailResponseDto>

  /**
   * Request a magic link for migration
   * Sends an email to the legacy email address with a magic link
   * @param email - The legacy email address
   * @param targetNationalId - The kennitala of the user requesting migration
   */
  requestMigration(email: string, targetNationalId: string): Promise<void>

  /**
   * Complete the migration after magic link verification
   * @param token - The magic link token
   * @param authenticatedNationalId - The nationalId of the currently authenticated user
   * @returns The newly created subscriber
   * @throws BadRequestException if token is invalid, expired, or nationalId doesn't match
   */
  completeMigration(
    token: string,
    authenticatedNationalId: string,
  ): Promise<SubscriberDto>

  /**
   * Auto-migrate a legacy user by kennitala on sign-in
   * Only migrates if the legacy user has the same kennitala and hasn't been migrated yet
   * @param nationalId - The kennitala to check for auto-migration
   * @returns The newly created subscriber if auto-migrated, null otherwise
   */
  autoMigrateByKennitala(nationalId: string): Promise<SubscriberDto | null>
}

export const ILegacyMigrationService = Symbol('ILegacyMigrationService')
