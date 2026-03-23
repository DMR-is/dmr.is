'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE CASE_CASE
      ADD COLUMN APPLICATION_TYPE VARCHAR(50) NOT NULL DEFAULT 'ad';

      ALTER TABLE CASE_CASE
      ADD COLUMN R_DRAFT_ID UUID;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE CASE_CASE DROP COLUMN IF EXISTS APPLICATION_TYPE;
      ALTER TABLE CASE_CASE DROP COLUMN IF EXISTS R_DRAFT_ID;

      COMMIT;
    `)
  },
}
