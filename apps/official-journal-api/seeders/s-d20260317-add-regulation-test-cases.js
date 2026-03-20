'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Update two existing cases to be regulation types for testing
    // Pick cases in 'Innsent' and 'Grunnvinnsla' statuses so they show up in active tabs
    await queryInterface.sequelize.query(`
      -- Set one case as base_regulation
      UPDATE CASE_CASE
      SET APPLICATION_TYPE = 'base_regulation'
      WHERE ID = '636986c9-d598-471b-9bbd-ed6660565ad0';

      -- Set one case as amending_regulation
      UPDATE CASE_CASE
      SET APPLICATION_TYPE = 'amending_regulation'
      WHERE ID = '9a329c8c-af18-4fb8-9785-f00c329bb84c';
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE CASE_CASE
      SET APPLICATION_TYPE = 'ad'
      WHERE ID IN (
        '636986c9-d598-471b-9bbd-ed6660565ad0',
        '9a329c8c-af18-4fb8-9785-f00c329bb84c'
      );
    `)
  },
}
