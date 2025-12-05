'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SIGNATURE
        ADD COLUMN ADVERT_ID UUID REFERENCES ADVERT(ID) NOT NULL UNIQUE;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SIGNATURE
        DROP COLUMN IF EXISTS ADVERT_ID;

      COMMIT;
    `)
  },
}
