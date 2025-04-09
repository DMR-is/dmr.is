'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter ADVERT_TYPE table
      ALTER TABLE ADVERT_TYPE ALTER COLUMN MAIN_TYPE_ID SET NOT NULL;
      COMMIT;
    `)
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to ADVERT_TYPE table
      ALTER TABLE ADVERT_TYPE ALTER COLUMN MAIN_TYPE_ID DROP NOT NULL;

      COMMIT;
    `)
  }
};
