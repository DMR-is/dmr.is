'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Drop unique constraint on email column
      ALTER TABLE LEGACY_SUBSCRIBERS
      DROP CONSTRAINT IF EXISTS legacy_subscribers_email_key,
      ADD COLUMN SUBSCRIBED_UNTIL TIMESTAMP WITH TIME ZONE;

      -- Also drop the index if it exists
      DROP INDEX IF EXISTS idx_legacy_subscribers_email;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Re-add unique constraint on email column
      ALTER TABLE LEGACY_SUBSCRIBERS
      ADD CONSTRAINT legacy_subscribers_email_key UNIQUE (EMAIL),
      DROP COLUMN IF EXISTS SUBSCRIBED_UNTIL;

      -- Re-add the index
      CREATE INDEX idx_legacy_subscribers_email ON LEGACY_SUBSCRIBERS(EMAIL);

      COMMIT;
    `)
  },
}
