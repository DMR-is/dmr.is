'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE FORECLOSURE
      ADD COLUMN CASE_NUMBER_IDENTIFIER TEXT DEFAULT NULL;


      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE FORECLOSURE
      DROP COLUMN IF EXISTS CASE_NUMBER_IDENTIFIER;

      COMMIT;
    `)
  },
}
