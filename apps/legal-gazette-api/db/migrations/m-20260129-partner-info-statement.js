'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;


      ALTER TABLE SETTLEMENT
        ADD COLUMN PARTNER_NATIONAL_ID TEXT DEFAULT NULL,
        ADD COLUMN PARTNER_NAME TEXT DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;


      ALTER TABLE SETTLEMENT
        DROP COLUMN IF EXISTS PARTNER_NATIONAL_ID,
        DROP COLUMN IF EXISTS PARTNER_NAME;

      COMMIT;
    `)
  },
}
