'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SETTLEMENT
        ADD COLUMN IF NOT EXISTS ENDING_DATE TIMESTAMPTZ;

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SETTLEMENT
        DROP COLUMN IF EXISTS ENDING_DATE;

      COMMIT;
    `)
  },
}
