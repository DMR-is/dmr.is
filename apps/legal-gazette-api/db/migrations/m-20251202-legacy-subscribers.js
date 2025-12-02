'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Table for imported legacy user data
      CREATE TABLE LEGACY_SUBSCRIBERS (
        ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMPTZ,

        NAME TEXT NOT NULL,
        EMAIL TEXT NOT NULL UNIQUE,
        NATIONAL_ID TEXT,  -- Nullable, may not have kennitala
        IS_ACTIVE BOOLEAN NOT NULL DEFAULT FALSE,
        PASSWORD_HASH TEXT,  -- For potential future password verification

        -- Migration tracking
        MIGRATED_AT TIMESTAMPTZ,
        MIGRATED_TO_SUBSCRIBER_ID UUID REFERENCES LEGAL_GAZETTE_SUBSCRIBERS(ID)
      );

      -- Table for magic link tokens
      CREATE TABLE LEGACY_MIGRATION_TOKENS (
        ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMPTZ DEFAULT NULL,

        TOKEN TEXT NOT NULL UNIQUE,
        EMAIL TEXT NOT NULL,
        TARGET_NATIONAL_ID TEXT NOT NULL,  -- The kennitala requesting migration
        EXPIRES_AT TIMESTAMPTZ NOT NULL,
        USED_AT TIMESTAMPTZ,  -- NULL until used, single-use enforcement

        LEGACY_SUBSCRIBER_ID UUID NOT NULL REFERENCES LEGACY_SUBSCRIBERS(ID)
      );

      CREATE INDEX idx_legacy_subscribers_email ON LEGACY_SUBSCRIBERS(EMAIL);
      CREATE INDEX idx_legacy_subscribers_national_id ON LEGACY_SUBSCRIBERS(NATIONAL_ID);
      CREATE INDEX idx_legacy_migration_tokens_token ON LEGACY_MIGRATION_TOKENS(TOKEN);

      -- Add reference to track migration source on subscriber
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      ADD COLUMN LEGACY_SUBSCRIBER_ID UUID REFERENCES LEGACY_SUBSCRIBERS(ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove foreign key column from subscribers
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      DROP COLUMN IF EXISTS LEGACY_SUBSCRIBER_ID;

      -- Drop indexes
      DROP INDEX IF EXISTS idx_legacy_migration_tokens_token;
      DROP INDEX IF EXISTS idx_legacy_subscribers_national_id;
      DROP INDEX IF EXISTS idx_legacy_subscribers_email;

      -- Drop tables
      DROP TABLE IF EXISTS LEGACY_MIGRATION_TOKENS;
      DROP TABLE IF EXISTS LEGACY_SUBSCRIBERS;

      COMMIT;
    `)
  },
}
