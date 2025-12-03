'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add subscribed_at column to subscribers table
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      ADD COLUMN SUBSCRIBED_AT TIMESTAMP WITH TIME ZONE;

      -- Add comment to column
      COMMENT ON COLUMN LEGAL_GAZETTE_SUBSCRIBERS.SUBSCRIBED_AT IS
        'Timestamp when subscriber first became active. Should not change if subscriber is deactivated and reactivated.';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove subscribed_at column from subscribers table
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      DROP COLUMN IF EXISTS SUBSCRIBED_AT;

      COMMIT;
    `)
  },
}
