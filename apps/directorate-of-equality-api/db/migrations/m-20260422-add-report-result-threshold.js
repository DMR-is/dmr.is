'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report_result
      ADD COLUMN salary_difference_threshold_percent DECIMAL(5, 2) DEFAULT NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report_result
      DROP COLUMN IF EXISTS salary_difference_threshold_percent;

    COMMIT;
    `)
  },
}
