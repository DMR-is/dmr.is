'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add subscribed_at column to legacy_subscribers table
      ALTER TABLE LEGACY_SUBSCRIBERS
      ADD COLUMN SUBSCRIBED_AT TIMESTAMP WITH TIME ZONE;

      -- Add comment to column
      COMMENT ON COLUMN LEGACY_SUBSCRIBERS.SUBSCRIBED_AT IS
        'Original subscription date from the legacy system. This will be transferred to new subscriber during migration.';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove subscribed_at column from legacy_subscribers table
      ALTER TABLE LEGACY_SUBSCRIBERS
      DROP COLUMN IF EXISTS SUBSCRIBED_AT;

      COMMIT;
    `)
  },
}
