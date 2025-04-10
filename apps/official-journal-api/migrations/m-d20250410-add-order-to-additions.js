'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter CASE_ADDITIONS table
      ALTER TABLE CASE_ADDITIONS ADD COLUMN "order" INTEGER DEFAULT 0;
      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to CASE_ADDITIONS table
      ALTER TABLE CASE_ADDITIONS DROP COLUMN "order";
      
      COMMIT;
    `)
  },
}
