'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Add UNKNOWN as the lowest-ordered company size. It is the default for
    // companies we have not yet classified (e.g. auto-provisioned on report
    // submission): it imposes no reporting obligation, but is honest about the
    // size being unknown rather than asserting the company is SMALL.
    //
    // ALTER TYPE ... ADD VALUE must be committed before the new value can be
    // referenced (Postgres forbids using it in the same transaction), so the
    // SET DEFAULT statements run separately, after this commits.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_size_enum ADD VALUE IF NOT EXISTS 'UNKNOWN' BEFORE 'SMALL';
    `)

    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company
        ALTER COLUMN employee_count_category SET DEFAULT 'UNKNOWN';
      ALTER TABLE company_report
        ALTER COLUMN employee_count_category SET DEFAULT 'UNKNOWN';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Restore the previous default. Postgres has no DROP VALUE, so the
    // 'UNKNOWN' enum member is left in place (removing it would require
    // recreating the type). Safe in practice: with no obligation attached,
    // any UNKNOWN rows behave like SMALL.
    return await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company
        ALTER COLUMN employee_count_category SET DEFAULT 'SMALL';
      ALTER TABLE company_report
        ALTER COLUMN employee_count_category SET DEFAULT 'SMALL';

      COMMIT;
    `)
  },
}
