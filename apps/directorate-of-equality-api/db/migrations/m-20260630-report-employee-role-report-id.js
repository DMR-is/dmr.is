'use strict'

/**
 * Roles were previously reachable only through the employees that reference
 * them (no direct report link). Draft reports need roles as first-class,
 * report-scoped children — own CRUD, clean per-report listing, and a clean
 * cascade on hard-delete. Add `report_id`, backfill it from the report each
 * role's employees belong to, drop any orphan roles, then enforce NOT NULL.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE report_employee_role
        ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES report(id);

      -- Each existing role is created per-report alongside its employees, so
      -- every referenced role resolves to exactly one report.
      UPDATE report_employee_role r
        SET report_id = (
          SELECT re.report_id
          FROM report_employee re
          WHERE re.report_employee_role_id = r.id
          LIMIT 1
        )
        WHERE report_id IS NULL;

      -- Roles no employee references have no report to belong to — drop them.
      DELETE FROM report_employee_role WHERE report_id IS NULL;

      ALTER TABLE report_employee_role ALTER COLUMN report_id SET NOT NULL;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE report_employee_role DROP COLUMN IF EXISTS report_id;
    `)
  },
}
