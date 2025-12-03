import { randomUUID } from 'crypto'

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { IAWSService } from '@dmr.is/modules'

import { LegacyMigrationTokenModel } from '../../models/legacy-migration-token.model'
import { LegacySubscriberModel } from '../../models/legacy-subscriber.model'
import { SubscriberDto, SubscriberModel } from '../../models/subscriber.model'
import {
  CheckLegacyEmailResult,
  ILegacyMigrationService,
} from './legacy-migration.service.interface'

const TOKEN_EXPIRY_HOURS = 24
const MAGIC_LINK_BASE_URL =
  process.env.LG_PUBLIC_WEB_URL || 'https://logbirtingablad.is'
const senderEmail =
  process.env.LEGACY_MIGRATION_SENDER_EMAIL ||
  'noreply@legal-gazette.dev.dmr-dev.cloud'

/**
 * Service for handling legacy subscriber migration to the new system.
 *
 * Supports three migration scenarios:
 * 1. Auto-migration for legacy users with kennitala (on sign-in)
 * 2. Magic link migration for legacy users without kennitala
 * 3. New registration with payment for non-legacy users
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

  /**
   * Check if an email exists in the legacy subscriber table
   */
  async checkLegacyEmail(email: string): Promise<CheckLegacyEmailResult> {
    const normalizedEmail = email.toLowerCase()

    const legacyUser = await this.legacySubscriberModel.findOne({
      where: { email: normalizedEmail },
    })

    if (!legacyUser) {
      return {
        exists: false,
        hasKennitala: false,
      }
    }

    return {
      exists: true,
      hasKennitala: !!legacyUser.nationalId,
    }
  }

  /**
   * Request a magic link for migration.
   * Sends an email to the legacy email address with a magic link.
   */
  async requestMigration(
    email: string,
    targetNationalId: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase()

    // Find legacy user
    const legacyUser = await this.legacySubscriberModel.findOne({
      where: { email: normalizedEmail },
    })

    if (!legacyUser) {
      throw new NotFoundException('Netfang fannst ekki í eldra áskriftarkerfi.')
    }

    // Check if already migrated
    if (legacyUser.migratedAt) {
      throw new BadRequestException(
        'Þessi áskrift hefur þegar verið flutt yfir í nýja kerfið.',
      )
    }

    // Generate secure token
    const token = this.generateSecureToken()

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS)

    // Create token record
    await this.legacyMigrationTokenModel.create({
      token,
      email: normalizedEmail,
      targetNationalId,
      expiresAt,
      legacySubscriberId: legacyUser.id,
    })

    // Build magic link URL
    const magicLinkUrl = `${MAGIC_LINK_BASE_URL}/skraning/flytja?token=${token}`

    // Send email
    await this.awsService.sendMail({
      from: `Lögbirtingablaðið <${senderEmail}>`,
      to: normalizedEmail,
      replyTo: senderEmail,
      subject: 'Staðfesting á flutningi áskriftar - Lögbirtingablaðið',
      html: this.buildMigrationEmailHtml(magicLinkUrl),
      text: this.buildMigrationEmailText(magicLinkUrl),
    })
  }

  /**
   * Complete the migration after magic link verification.
   */
  async completeMigration(
    token: string,
    authenticatedNationalId: string,
  ): Promise<SubscriberDto> {
    // Find token with associated legacy subscriber
    const migrationToken = await this.legacyMigrationTokenModel.findOne({
      where: { token: token },
      include: [{ model: LegacySubscriberModel, as: 'legacySubscriber' }],
    })

    if (!migrationToken) {
      throw new NotFoundException('Ógildur eða útrunninn hlekkur.')
    }

    // Check if token is valid (not expired and not used)
    if (!migrationToken.isValid()) {
      throw new BadRequestException(
        'Hlekkurinn er útrunninn eða hefur þegar verið notaður.',
      )
    }

    // Verify that authenticated user matches the token target
    if (migrationToken.targetNationalId !== authenticatedNationalId) {
      throw new BadRequestException(
        'Innskráður notandi passar ekki við flutningsbeiðni.',
      )
    }

    const legacyUser = migrationToken.legacySubscriber
    if (!legacyUser) {
      throw new NotFoundException('Eldri áskrifandi fannst ekki.')
    }

    // Create new subscriber with legacy user's data
    // Use legacy user's subscription date if available
    const subscribedAt = legacyUser.isActive ? legacyUser.subscribedAt : null

    const [newSubscriber, created] = await this.subscriberModel.findOrCreate({
      where: { nationalId: authenticatedNationalId },
      defaults: {
        nationalId: authenticatedNationalId,
        name: legacyUser.name,
        isActive: legacyUser.isActive,
        subscribedAt,
      },
    })

    if (!created) {
      newSubscriber.isActive = legacyUser.isActive
      // Only set subscribedAt if it's not already set (preserve original subscription date)
      if (!newSubscriber.subscribedAt && legacyUser.isActive) {
        newSubscriber.subscribedAt = subscribedAt
      }
      await newSubscriber.save()
    }

    // Mark token as used
    migrationToken.usedAt = new Date()
    await migrationToken.save()

    // Mark legacy subscriber as migrated
    await this.legacySubscriberModel.update(
      {
        migratedAt: new Date(),
        migratedToSubscriberId: newSubscriber.id,
      },
      {
        where: { id: legacyUser.id },
      },
    )

    return newSubscriber.fromModel()
  }

  /**
   * Auto-migrate a legacy user by kennitala on sign-in.
   * Only migrates if the legacy user has the same kennitala and hasn't been migrated yet.
   * Returns null if migration is not possible or if any error occurs.
   */
  async autoMigrateByKennitala(
    nationalId: string,
  ): Promise<SubscriberDto | null> {
    try {
      // Find legacy user by kennitala
      const legacyUser = await this.legacySubscriberModel.findOne({
        where: { nationalId },
      })

      // No legacy user found
      if (!legacyUser) {
        return null
      }

      // Already migrated
      if (legacyUser.migratedAt) {
        return null
      }

      // Create new subscriber
      // Use legacy user's subscription date if available
      const subscribedAt = legacyUser.isActive ? legacyUser.subscribedAt : null

      const newSubscriber = await this.subscriberModel.create({
        nationalId,
        name: legacyUser.name,
        isActive: legacyUser.isActive,
        subscribedAt,
      })

      // Mark legacy user as migrated
      await this.legacySubscriberModel.update(
        {
          migratedAt: new Date(),
          migratedToSubscriberId: newSubscriber.id,
        },
        {
          where: { id: legacyUser.id },
        },
      )

      return newSubscriber.fromModel()
    } catch {
      // If any database error occurs (e.g., table doesn't exist yet),
      // return null to allow normal subscriber creation flow
      return null
    }
  }

  /**
   * Generate a cryptographically secure token.
   * Uses UUID v4 which provides 122 bits of randomness.
   */
  private generateSecureToken(): string {
    // Generate two UUIDs and combine them for extra security (64 characters)
    return `${randomUUID()}${randomUUID()}`.replace(/-/g, '')
  }

  /**
   * Build HTML email content for migration email.
   */
  private buildMigrationEmailHtml(magicLinkUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="is">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #0061ff;">Lögbirtingablaðið</h1>
    <p>Sæl/l,</p>
    <p>Þú hefur óskað eftir að flytja áskriftina þína á Lögbirtingablaðinu yfir í nýja kerfið.</p>
    <p>Smelltu á eftirfarandi hlekk til að ljúka flutningnum:</p>
    <p style="margin: 30px 0;">
      <a href="${magicLinkUrl}"
         style="background-color: #0061ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Ljúka flutningi
      </a>
    </p>
    <p><strong>Hlekkurinn er virkur í 24 klukkustundir.</strong></p>
    <p>Ef þú baðst ekki um þennan flutning, vinsamlegast hunsaðu þennan tölvupóst.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">
      Kveðja,<br>
      Lögbirtingablaðið
    </p>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Build plain text email content for migration email.
   */
  private buildMigrationEmailText(magicLinkUrl: string): string {
    return `
Sæl/l,

Þú hefur óskað eftir að flytja áskriftina þína á Lögbirtingablaðinu yfir í nýja kerfið.

Smelltu á eftirfarandi hlekk til að ljúka flutningnum:
${magicLinkUrl}

Hlekkurinn er virkur í 24 klukkustundir.

Ef þú baðst ekki um þennan flutning, vinsamlegast hunsaðu þennan tölvupóst.

Kveðja,
Lögbirtingablaðið
    `.trim()
  }
}
