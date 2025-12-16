'use strict'

/**
 * Migration: Alter legal_gazette_subscribers table
 *
 * Changes:
 * - Remove: subscribed_at column
 * - Remove: legacy_subscriber_id column (FK to legacy_subscribers being dropped)
 * - Add: subscribed_from (DATE) - when subscription started
 * - Add: email (TEXT) - subscriber email
 * - Add: subscribed_to (DATE, nullable) - when subscription ended (null = active)
 *
 * Must run BEFORE dropping legacy tables migration.
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove legacy_subscriber_id column (FK will be dropped with table)
      ALTER TABLE legal_gazette_subscribers
      DROP COLUMN IF EXISTS legacy_subscriber_id;

      -- Rename subscribed_at to subscribed_from and change type to DATE
      ALTER TABLE legal_gazette_subscribers
      DROP COLUMN IF EXISTS subscribed_at;

      ALTER TABLE legal_gazette_subscribers
      ADD COLUMN subscribed_from TIMESTAMP WITH TIME ZONE;

      -- Add email column
      ALTER TABLE legal_gazette_subscribers
      ADD COLUMN email TEXT;

      -- Add subscribed_to column (nullable - null means still subscribed)
      ALTER TABLE legal_gazette_subscribers
      ADD COLUMN subscribed_to TIMESTAMP WITH TIME ZONE;

      -- Add comments
      COMMENT ON COLUMN legal_gazette_subscribers.subscribed_from IS
        'Date when subscription started';
      COMMENT ON COLUMN legal_gazette_subscribers.email IS
        'Subscriber email address';
      COMMENT ON COLUMN legal_gazette_subscribers.subscribed_to IS
        'Date when subscription ended. NULL means subscription is still active';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove new columns
      ALTER TABLE legal_gazette_subscribers
      DROP COLUMN IF EXISTS subscribed_from,
      DROP COLUMN IF EXISTS email,
      DROP COLUMN IF EXISTS subscribed_to;

      -- Re-add subscribed_at column
      ALTER TABLE legal_gazette_subscribers
      ADD COLUMN subscribed_at TIMESTAMP WITH TIME ZONE;

      -- Re-add legacy_subscriber_id column
      ALTER TABLE legal_gazette_subscribers
      ADD COLUMN legacy_subscriber_id UUID;

      COMMIT;
    `)
  },
}
