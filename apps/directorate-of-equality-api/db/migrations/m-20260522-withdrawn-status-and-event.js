'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- 1. WITHDRAWN status.
    --
    -- Terminal status assigned to a SUBMITTED report when the same
    -- company submits a new report of the same type. The applicant
    -- has changed their mind before any reviewer touched the prior
    -- submission, so it is safe to silently retire the old row and
    -- accept the new one in its place. IN_REVIEW / POSTPONED prior
    -- reports are NOT auto-withdrawn — those flows are active and
    -- the new submission is rejected with 409 instead.
    -- ============================================================

    ALTER TYPE report_status_enum ADD VALUE IF NOT EXISTS 'WITHDRAWN';

    -- ============================================================
    -- 2. WITHDRAWN event type.
    --
    -- Emitted on the withdrawn report, with related_report_id
    -- pointing at the new report that replaced it (mirroring the
    -- SUPERSEDED event shape).
    -- ============================================================

    ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'WITHDRAWN';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Postgres has no native DROP VALUE for enums. Reversing WITHDRAWN
    -- requires the rename-recreate dance. In dev (no live data) the
    -- forward direction is the one that matters; this down() is
    -- best-effort and will fail if any row currently holds the value
    -- being removed. Resolve such rows manually before running down().

    ALTER TYPE report_event_type_enum RENAME TO report_event_type_enum_new;

    CREATE TYPE report_event_type_enum AS ENUM (
      'SUBMITTED',
      'ASSIGNED',
      'UNASSIGNED',
      'STATUS_CHANGED',
      'SUPERSEDED',
      'EDITED'
    );

    ALTER TABLE report_event
      ALTER COLUMN event_type TYPE report_event_type_enum
      USING event_type::text::report_event_type_enum;

    DROP TYPE report_event_type_enum_new;

    ALTER TYPE report_status_enum RENAME TO report_status_enum_new;

    CREATE TYPE report_status_enum AS ENUM (
      'DRAFT',
      'SUBMITTED',
      'POSTPONED',
      'IN_REVIEW',
      'DENIED',
      'APPROVED',
      'SUPERSEDED'
    );

    ALTER TABLE report
      ALTER COLUMN status TYPE report_status_enum
      USING status::text::report_status_enum;

    ALTER TABLE report_event
      ALTER COLUMN report_status TYPE report_status_enum
      USING report_status::text::report_status_enum;

    ALTER TABLE report_event
      ALTER COLUMN from_status TYPE report_status_enum
      USING from_status::text::report_status_enum;

    ALTER TABLE report_event
      ALTER COLUMN to_status TYPE report_status_enum
      USING to_status::text::report_status_enum;

    ALTER TABLE report_comment
      ALTER COLUMN report_status TYPE report_status_enum
      USING report_status::text::report_status_enum;

    DROP TYPE report_status_enum_new;

    COMMIT;
    `)
  },
}
