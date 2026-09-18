'use strict'

/**
 * The employee `education` field is unused downstream (never fed into
 * scoring, statistics, or report generation) and is being removed
 * end-to-end. Drop the column and its backing enum type.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report_employee DROP COLUMN IF EXISTS education;

      DROP TYPE IF EXISTS education_enum;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Data is lost; existing rows are backfilled to a placeholder value so the
    // NOT NULL constraint can be restored.
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE education_enum AS ENUM (
        'COMPULSORY',
        'UPPER_SECONDARY',
        'VOCATIONAL',
        'BACHELOR',
        'MASTER',
        'DOCTORATE',
        'PROFESSIONAL'
      );

      ALTER TABLE report_employee
        ADD COLUMN education education_enum NOT NULL DEFAULT 'COMPULSORY';

      ALTER TABLE report_employee ALTER COLUMN education DROP DEFAULT;

      COMMIT;
    `)
  },
}
