'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter CASE_CASE table
      ALTER TABLE CASE_CASE ADD COLUMN PROPOSED_ADVERT_ID UUID;
      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to CASE_CASE table
      ALTER TABLE CASE_CASE DROP COLUMN PROPOSED_ADVERT_ID;
      
      COMMIT;
    `)
  },
}
