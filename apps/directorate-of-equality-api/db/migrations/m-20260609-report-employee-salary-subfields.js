'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- report_employee salary breakdown
    --
    -- The two flat parent salary columns (additional_salary, bonus_salary)
    -- are replaced by 6 sub-component columns that compose them:
    --
    --   additional_salary (viðbótarlaun) =
    --       additional_fixed_overtime + additional_fixed_car_allowance
    --   bonus_salary (aukagreiðslur) =
    --       bonus_occasional_car_allowance + bonus_occasional_overtime
    --     + bonus_payments + bonus_other
    --
    -- Parents are no longer stored — they are derived on read (each child
    -- treated as 0 when NULL). All 6 children are nullable: NULL means
    -- "not entered", distinct from an entered 0.
    -- ============================================================

    ALTER TABLE report_employee
      DROP COLUMN additional_salary,
      DROP COLUMN bonus_salary;

    ALTER TABLE report_employee
      ADD COLUMN additional_fixed_overtime      DECIMAL(14, 2) DEFAULT NULL,
      ADD COLUMN additional_fixed_car_allowance DECIMAL(14, 2) DEFAULT NULL,
      ADD COLUMN bonus_occasional_car_allowance DECIMAL(14, 2) DEFAULT NULL,
      ADD COLUMN bonus_occasional_overtime      DECIMAL(14, 2) DEFAULT NULL,
      ADD COLUMN bonus_payments                 DECIMAL(14, 2) DEFAULT NULL,
      ADD COLUMN bonus_other                    DECIMAL(14, 2) DEFAULT NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report_employee
      DROP COLUMN additional_fixed_overtime,
      DROP COLUMN additional_fixed_car_allowance,
      DROP COLUMN bonus_occasional_car_allowance,
      DROP COLUMN bonus_occasional_overtime,
      DROP COLUMN bonus_payments,
      DROP COLUMN bonus_other;

    ALTER TABLE report_employee
      ADD COLUMN additional_salary DECIMAL(14, 2) NOT NULL DEFAULT 0,
      ADD COLUMN bonus_salary      DECIMAL(14, 2) DEFAULT NULL;

    COMMIT;
    `)
  },
}
