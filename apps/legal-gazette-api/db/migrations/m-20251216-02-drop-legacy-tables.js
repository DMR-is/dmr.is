'use strict'

/**
 * Migration: Drop legacy tables
 *
 * Tables dropped:
 * - legacy_migration_tokens (must be dropped first due to FK to legacy_subscribers)
 * - legacy_subscribers
 *
 * Must run AFTER m-20251216-01-alter-subscribers-table.js
 */
module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Drop legacy_migration_tokens first (has FK to legacy_subscribers)
      DROP TABLE IF EXISTS legacy_migration_tokens CASCADE;

      -- Drop legacy_subscribers
      DROP TABLE IF EXISTS legacy_subscribers CASCADE;

      COMMIT;
    `)
  },

  down(queryInterface) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Re-create legacy_subscribers table
      CREATE TABLE legacy_subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        national_id TEXT,
        is_active BOOLEAN NOT NULL DEFAULT false,
        subscribed_at TIMESTAMP WITH TIME ZONE,
        subscribed_until TIMESTAMP WITH TIME ZONE,
        password_hash TEXT,
        migrated_at TIMESTAMP WITH TIME ZONE,
        migrated_to_subscriber_id UUID REFERENCES legal_gazette_subscribers(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Re-create legacy_migration_tokens table
      CREATE TABLE legacy_migration_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        target_national_id TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        legacy_subscriber_id UUID NOT NULL REFERENCES legacy_subscribers(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      -- Add indexes
      CREATE INDEX idx_legacy_subscribers_national_id ON legacy_subscribers(national_id);
      CREATE INDEX idx_legacy_migration_tokens_token ON legacy_migration_tokens(token);

      COMMIT;
    `)
  },
}
