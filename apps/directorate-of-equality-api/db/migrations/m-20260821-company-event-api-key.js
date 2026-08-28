'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block:
    // Postgres forbids referencing a newly added value in the same
    // transaction that added it. Hence no BEGIN/COMMIT here, unlike the
    // rest of this directory.
    //
    // Issuing and revoking a machine credential is a company-lifecycle
    // event, so it belongs on the existing company_event feed rather
    // than in a table of its own — the admin timeline then surfaces it
    // for free.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'API_KEY_ISSUED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'API_KEY_REVOKED';
    `)
  },

  async down(queryInterface) {
    // Postgres cannot drop an enum value, so reversing means rebuilding
    // the type without the two added values.
    //
    // Two things about the member list below.
    //
    // It is the FULL current set minus what this migration adds — not the
    // list from whichever migration this was copied from.
    // m-20260626-company-event-type-enum-fines-quarantine hardcoded the
    // set as it stood then, and later migrations have since made that
    // `down` lossy: running it today would silently drop four reminder
    // values.
    //
    // And the ORDER is the physical order of the live type (i.e. the order
    // the migrations added the values in), NOT the declaration order of
    // CompanyEventTypeEnum. The two differ: m-20260623 added the
    // ..._REMINDER_SENT pair before m-20260626 added the fines/quarantine
    // ones, while the TS enum lists fines/quarantine first. Enum order
    // decides how Postgres sorts the column (company.enums.ts calls this
    // out as load-bearing), so rebuilding in declaration order would have
    // `down` quietly change sort behaviour instead of restoring it.
    // Verify against: SELECT unnest(enum_range(NULL::company_event_type_enum));
    await queryInterface.sequelize.query(`
    BEGIN;

    -- company_event_status_changed_chk compares event_type against an enum
    -- LITERAL, and that literal was bound to company_event_type_enum when the
    -- constraint was created (m-20260616). Switching the column to TEXT leaves
    -- the constraint comparing text to an enum, for which no operator exists,
    -- and the ALTER fails with:
    --   operator does not exist: text <> company_event_type_enum
    -- So it has to come off before the swap and go back on after. The
    -- migration this pattern was copied from
    -- (m-20260626-company-event-type-enum-fines-quarantine) omits this, so its
    -- own down cannot actually run — verified by running it.
    ALTER TABLE company_event
      DROP CONSTRAINT company_event_status_changed_chk;

    ALTER TABLE company_event
      ALTER COLUMN event_type TYPE TEXT;

    DELETE FROM company_event
      WHERE event_type IN ('API_KEY_ISSUED', 'API_KEY_REVOKED');

    DROP TYPE company_event_type_enum;

    CREATE TYPE company_event_type_enum AS ENUM (
      'CREATED',
      'STATUS_CHANGED',
      'EQUALITY_REPORT_DEADLINE_REMINDER_SENT',
      'SALARY_REPORT_DEADLINE_REMINDER_SENT',
      'FINES_STARTED',
      'FINES_STOPPED',
      'QUARANTINED',
      'UNQUARANTINED',
      'EQUALITY_REPORT_DEADLINE_REMINDER_NO_EMAIL',
      'SALARY_REPORT_DEADLINE_REMINDER_NO_EMAIL'
    );

    ALTER TABLE company_event
      ALTER COLUMN event_type TYPE company_event_type_enum
        USING event_type::company_event_type_enum;

    -- Restored verbatim from m-20260616.
    ALTER TABLE company_event
      ADD CONSTRAINT company_event_status_changed_chk CHECK (
        event_type <> 'STATUS_CHANGED' OR (
          from_status IS NOT NULL
          AND to_status IS NOT NULL
          AND status = to_status
        )
      );

    COMMIT;
    `)
  },
}
