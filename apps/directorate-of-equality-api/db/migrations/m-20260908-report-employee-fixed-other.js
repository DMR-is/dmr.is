'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Launaliðir 2.0 — re-cut along fixed vs. incidental
    --
    -- Excel template 2.0 (jafnrettisstofa-launagreining, 2026-09-08) redefines
    -- the Launagögn pay columns. Column positions did NOT move; three of them
    -- changed meaning:
    --
    --   L  was "Tilfallandi / mældur bifreiðastyrkur"  (incidental)
    --      now "Aðrar reglulegar greiðslur / hlunnindi" (FIXED)  -> new column
    --   N  was "Bónusgreiðslur"
    --      now "Tilfallandi / mældur bifreiðastyrkur"  -> bonus_occasional_car_allowance
    --   O  was "Önnur hlunnindi eða greiðslur"
    --      now "Aðrar tilfallandi greiðslur / hlunnindi" -> bonus_other
    --
    -- Two schema consequences:
    --
    -- 1. Viðbótarlaun gains a third component -> additional_fixed_other.
    -- 2. "Bónusgreiðslur" no longer exists as a field. Bonuses now belong in
    --    "Aðrar tilfallandi greiðslur / hlunnindi", so bonus_payments has no
    --    source column from 2.0 onwards and is merged into bonus_other.
    --
    -- The merge is arithmetically invisible: both columns already summed into
    -- aukagreiðslur (bonusSalary) with identical weight, so every historic
    -- aukagreiðslur total is unchanged. What it costs is the per-component
    -- split on historic rows -- nothing surfaces it (the UI renders only the
    -- derived parents), but the loss is permanent. See the down() note below.
    --
    -- Regluleg laun narrows to grunnlaun + viðbótarlaun in the same release;
    -- that is a code change, not a schema one, since both parents are derived.
    -- ============================================================

    ALTER TABLE report_employee
      ADD COLUMN additional_fixed_other DECIMAL(14, 2) DEFAULT NULL;

    -- COALESCE only where at least one side is present, so a row with neither
    -- entered keeps NULL ("not entered") rather than acquiring a spurious 0.
    -- That distinction is load-bearing: NULL and 0 mean different things on
    -- every pay column here.
    UPDATE report_employee
      SET bonus_other = COALESCE(bonus_other, 0) + COALESCE(bonus_payments, 0)
      WHERE bonus_payments IS NOT NULL;

    ALTER TABLE report_employee
      DROP COLUMN bonus_payments;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ⚠️ NOT a true inverse. The up-migration folded bonus_payments into
    -- bonus_other and the two are no longer separable, so this restores the
    -- COLUMN but not its VALUES -- every row comes back NULL, with the merged
    -- amount left sitting in bonus_other.
    --
    -- Aukagreiðslur totals therefore survive a rollback intact; only the
    -- breakdown stays merged. This path exists to unblock a rollback, not to
    -- recover the split. Restore from a backup if the split is needed.
    ALTER TABLE report_employee
      ADD COLUMN bonus_payments DECIMAL(14, 2) DEFAULT NULL;

    ALTER TABLE report_employee
      DROP COLUMN additional_fixed_other;

    COMMIT;
    `)
  },
}
