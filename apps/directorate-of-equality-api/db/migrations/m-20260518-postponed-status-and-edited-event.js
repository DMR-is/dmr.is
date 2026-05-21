'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- 1. POSTPONED status.
    --
    -- A salary report submitted with all outliers deferred lands on
    -- POSTPONED instead of SUBMITTED. It cannot be picked up by a
    -- reviewer; the applicant resolves it via
    -- PUT /application/reports/:providerId/outliers, which transitions
    -- POSTPONED -> SUBMITTED. See db/README.md -> "Report lifecycle".
    -- ============================================================

    ALTER TYPE report_status_enum ADD VALUE IF NOT EXISTS 'POSTPONED';

    -- ============================================================
    -- 2. EDITED event type.
    --
    -- Emitted whenever the applicant edits a report in place via the new
    -- PUT endpoints (equality-content / outliers). Carries timestamp +
    -- company_id; no payload beyond that. When the edit also causes a
    -- status transition (POSTPONED -> SUBMITTED), a separate
    -- STATUS_CHANGED event captures the transition.
    -- ============================================================

    ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'EDITED';

    -- ============================================================
    -- 3. Drop report.outliers_postponed.
    --
    -- The boolean is redundant now that POSTPONED is a first-class status:
    -- (status = POSTPONED) <=> outliers postponed. Single source of truth.
    -- The audit signal "did this report ever postpone?" is preserved by
    -- the report_event stream — the SUBMITTED event for a postponed salary
    -- report carries report_status = POSTPONED, queryable forever.
    -- ============================================================

    ALTER TABLE report DROP COLUMN outliers_postponed;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Re-add the dropped column with the original default.
    ALTER TABLE report
      ADD COLUMN outliers_postponed BOOLEAN NOT NULL DEFAULT FALSE;

    -- Postgres has no native DROP VALUE for enums. Reversing POSTPONED /
    -- EDITED requires the rename-recreate dance. In dev (no live data) the
    -- forward direction is the one that matters; this down() is best-effort
    -- and will fail if any row currently holds the values being removed.
    -- Resolve such rows manually before running down() against any DB you
    -- care about.

    ALTER TYPE report_event_type_enum RENAME TO report_event_type_enum_new;

    CREATE TYPE report_event_type_enum AS ENUM (
      'SUBMITTED',
      'ASSIGNED',
      'UNASSIGNED',
      'STATUS_CHANGED',
      'SUPERSEDED'
    );

    ALTER TABLE report_event
      ALTER COLUMN event_type TYPE report_event_type_enum
      USING event_type::text::report_event_type_enum;

    DROP TYPE report_event_type_enum_new;

    ALTER TYPE report_status_enum RENAME TO report_status_enum_new;

    CREATE TYPE report_status_enum AS ENUM (
      'DRAFT',
      'SUBMITTED',
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
