'use strict'

/**
 * Svið (field) and deild (department) are not always known/applicable for an
 * employee at draft time. Relax the NOT NULL constraint to match.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE report_employee ALTER COLUMN field DROP NOT NULL;
      ALTER TABLE report_employee ALTER COLUMN department DROP NOT NULL;
    `)
  },

  async down(queryInterface) {
    // Reinstating NOT NULL requires no NULLs — backfill first.
    await queryInterface.sequelize.query(`
      UPDATE report_employee SET field = '' WHERE field IS NULL;
      UPDATE report_employee SET department = '' WHERE department IS NULL;
      ALTER TABLE report_employee ALTER COLUMN field SET NOT NULL;
      ALTER TABLE report_employee ALTER COLUMN department SET NOT NULL;
    `)
  },
}
