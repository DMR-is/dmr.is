'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT
        ADD COLUMN EXTERNAL_ID TEXT DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT
        DROP COLUMN IF EXISTS EXTERNAL_ID;

      COMMIT;
    `)
  },
}
