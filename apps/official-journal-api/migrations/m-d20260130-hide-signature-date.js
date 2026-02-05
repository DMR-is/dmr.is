'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT 
      ADD COLUMN HIDE_SIGNATURE_DATE BOOLEAN DEFAULT false;

      ALTER TABLE CASE_CASE 
      ADD COLUMN HIDE_SIGNATURE_DATE BOOLEAN DEFAULT false;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT 
      DROP COLUMN IF EXISTS HIDE_SIGNATURE_DATE;

      ALTER TABLE CASE_CASE 
      DROP COLUMN IF EXISTS HIDE_SIGNATURE_DATE;

      COMMIT;
    `)
  },
}
