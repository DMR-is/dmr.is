'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_PUBLICATION
        ADD COLUMN PDF_URL TEXT DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_PUBLICATION
        DROP COLUMN IF EXISTS PDF_URL;

      COMMIT;
    `)
  },
}
