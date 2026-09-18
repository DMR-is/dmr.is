'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Drop report_role_result.
    --
    -- It was created in the initial migration as the "reserved home for a
    -- future role-level breakdown". Four months on it is written by NO code
    -- path anywhere in src -- verified: exactly one reference, a findAll in
    -- ReportService.loadSalaryCalculations, which therefore always returned []
    -- and surfaced ReportDetailDto.roleResults as an empty array forever.
    --
    -- Two reasons to remove it now rather than leave it reserved:
    --
    --   1. It was the LAST holder of the retired base/full duality -- its DTO
    --      still declared base_snapshot and full_snapshot, the exact shape that
    --      became arithmetically incoherent when the pay model moved to an
    --      hours denominator. A reserved table modelling a retired concept is
    --      not a head start, it is a trap: the next person to implement role
    --      breakdowns would have inherited the monthly-FTE world by accident.
    --   2. A destructive migration and a client regeneration are already
    --      happening in this batch, so the removal is nearly free.
    --
    -- Whoever builds role-level stats should design the table against reglulegt
    -- timakaup then, not inherit this one.
    --
    -- Indexes and FK constraints go with the table; DROP TABLE removes them.
    -- ============================================================

    DROP TABLE IF EXISTS report_role_result;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Restores the table and all three indexes exactly as the initial migration
    -- created them (uuid_generate_v4, TIMESTAMPTZ created_at/updated_at). It
    -- will stay empty on the way back: nothing ever wrote to it.
    CREATE TABLE IF NOT EXISTS report_role_result (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      report_result_id UUID NOT NULL REFERENCES report_result(id),
      report_employee_role_id UUID NOT NULL REFERENCES report_employee_role(id),
      role_title TEXT NOT NULL,
      base_snapshot JSONB NOT NULL,
      full_snapshot JSONB NOT NULL
    );

    CREATE INDEX report_role_result_report_result_id_idx
      ON report_role_result (report_result_id);
    CREATE INDEX report_role_result_report_employee_role_id_idx
      ON report_role_result (report_employee_role_id);
    CREATE UNIQUE INDEX report_role_result_report_result_role_uidx
      ON report_role_result (report_result_id, report_employee_role_id);

    COMMIT;
    `)
  },
}
