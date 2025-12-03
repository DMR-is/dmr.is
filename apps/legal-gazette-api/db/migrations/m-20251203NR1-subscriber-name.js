'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Add name column to subscribers table
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      ADD COLUMN NAME TEXT;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Remove name column from subscribers table
      ALTER TABLE LEGAL_GAZETTE_SUBSCRIBERS
      DROP COLUMN IF EXISTS NAME;

      COMMIT;
    `)
  },
}
