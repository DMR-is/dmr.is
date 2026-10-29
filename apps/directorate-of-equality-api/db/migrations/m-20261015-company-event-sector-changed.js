'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block, so no
    // BEGIN/COMMIT — the same as m-20261014-company-event-due-date-changed.
    //
    // An admin reclassifying a company's sector by hand. Recorded on the
    // timeline because sector now decides what a company owes and may file: a
    // RADUNEYTI company owes a salary report whatever its size, and a
    // SVEITARFELAG company may file one without equality coverage.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'SECTOR_CHANGED';
    `)

    // Separate statement: a new enum value is only usable once the ADD VALUE
    // that created it has committed.
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_event
        ADD COLUMN IF NOT EXISTS from_sector company_sector_enum DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS to_sector company_sector_enum DEFAULT NULL;

      COMMENT ON COLUMN company_event.from_sector IS 'Sector before a SECTOR_CHANGED event; null on every other event.';
      COMMENT ON COLUMN company_event.to_sector IS 'Sector after a SECTOR_CHANGED event; null on every other event.';

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'company_event_sector_changed_chk'
        ) THEN
          ALTER TABLE company_event
            ADD CONSTRAINT company_event_sector_changed_chk CHECK (
              event_type <> 'SECTOR_CHANGED'
              OR (from_sector IS NOT NULL AND to_sector IS NOT NULL)
            );
        END IF;
      END $$;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // The enum value stays, for the reason m-20260821-company-event-api-key
    // gives: Postgres cannot drop an enum value in place.
    await queryInterface.sequelize.query(`
      BEGIN;
      ALTER TABLE company_event DROP CONSTRAINT IF EXISTS company_event_sector_changed_chk;
      ALTER TABLE company_event DROP COLUMN IF EXISTS from_sector;
      ALTER TABLE company_event DROP COLUMN IF EXISTS to_sector;
      COMMIT;
    `)
  },
}
