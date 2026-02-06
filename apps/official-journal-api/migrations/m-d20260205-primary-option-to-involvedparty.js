'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_INVOLVED_PARTY 
      ADD COLUMN IS_PRIMARY BOOLEAN DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_INVOLVED_PARTY 
      DROP COLUMN IF EXISTS IS_PRIMARY;

      COMMIT;
    `)
  },
}
