'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block.
    //
    // COMMUNICATION_OPENED / COMMUNICATION_CLOSED audit the reviewer opening
    // and closing the communication thread with the applicant. The directional
    // sub-states (AWAITING_RESPONSE <-> RESPONSE_RECEIVED) flip on comments and
    // are not events; only the explicit open/close transitions are recorded.
    await queryInterface.sequelize.query(`
      ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'COMMUNICATION_OPENED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE report_event_type_enum ADD VALUE IF NOT EXISTS 'COMMUNICATION_CLOSED';
    `)

    // report.communication_status — the persisted state of the applicant
    // conversation. Replaces the previously derived waitingForAction boolean.
    //   NOT_STARTED       never opened; the applicant cannot comment
    //   OPEN              open, no message exchanged yet; the applicant may comment
    //   AWAITING_RESPONSE open, reviewer messaged; ball in the applicant's court
    //   RESPONSE_RECEIVED open, applicant has replied (overview "Beðið svara" icon)
    //   CLOSED            reviewer closed the thread; the applicant cannot comment
    // Existing rows backfill to NOT_STARTED via the column default.
    await queryInterface.sequelize.query(`
      BEGIN;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_status_enum') THEN
          CREATE TYPE communication_status_enum AS ENUM (
            'NOT_STARTED',
            'OPEN',
            'AWAITING_RESPONSE',
            'RESPONSE_RECEIVED',
            'CLOSED'
          );
        END IF;
      END $$;

      ALTER TABLE report
        ADD COLUMN IF NOT EXISTS communication_status communication_status_enum
        NOT NULL DEFAULT 'NOT_STARTED';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Postgres cannot drop an enum value, so the COMMUNICATION_OPENED /
    // COMMUNICATION_CLOSED event-type values are left in place. Drop the column,
    // its enum type, and any audit-only rows that depend on the new events.
    await queryInterface.sequelize.query(`
      BEGIN;

      DELETE FROM report_event
        WHERE event_type IN ('COMMUNICATION_OPENED', 'COMMUNICATION_CLOSED');

      ALTER TABLE report DROP COLUMN IF EXISTS communication_status;

      DROP TYPE IF EXISTS communication_status_enum;

      COMMIT;
    `)
  },
}
