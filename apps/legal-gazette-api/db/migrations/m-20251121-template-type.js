'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE TEMPLATE_TYPE AS ENUM (
      'COMMON',
      'RECALL_BANKRUPTCY',
      'RECALL_DECEASED',
      'DIVISION_MEETING_BANKRUPTCY',
      'DIVISION_MEETING_DECEASED',
      'DIVISION_ENDING'
    );

      ALTER TABLE ADVERT
      ADD COLUMN TEMPLATE_TYPE TEMPLATE_TYPE DEFAULT 'COMMON';


      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT
      DROP COLUMN IF EXISTS TEMPLATE_TYPE;

      DROP TYPE IF EXISTS TEMPLATE_TYPE;

      COMMIT;
    `)
  },
}
