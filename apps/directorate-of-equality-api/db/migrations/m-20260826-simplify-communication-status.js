'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ============================================================
    // Drop CommunicationStatusEnum.OPEN.
    //
    // The reviewer no longer opens or closes the applicant conversation by
    // hand — after testing, admins found the toggle to be a second thing to
    // remember on top of writing the comment. The status is now a projection of
    // what has happened on the thread: a reviewer's external comment moves it
    // to AWAITING_RESPONSE, an applicant's reply to RESPONSE_RECEIVED, and
    // concluding the review to CLOSED.
    //
    // That leaves OPEN with nothing to mean. It described "opened, but nobody
    // has said anything yet", a state only the explicit open action could
    // produce. Existing OPEN rows migrate to AWAITING_RESPONSE rather than
    // NOT_STARTED: the applicant on those reports has already been let into the
    // conversation, and NOT_STARTED would silently lock them out.
    //
    // Postgres cannot remove a value from an enum type, so the type is
    // recreated and the column swapped onto it.
    // ============================================================
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- Compare the column as text, not as the enum. Written the obvious way
    -- (communication_status = 'OPEN') Postgres coerces the literal into the
    -- enum type and raises "invalid input value" on any database whose type has
    -- no OPEN label — a rebuilt-from-dump checkout, or a second run of this
    -- migration. Casting left-hand-side to text makes the no-op case a no-op.
    UPDATE report
      SET communication_status = 'AWAITING_RESPONSE'
      WHERE communication_status::text = 'OPEN';

    ALTER TYPE communication_status_enum
      RENAME TO communication_status_enum_old;

    CREATE TYPE communication_status_enum AS ENUM (
      'NOT_STARTED',
      'AWAITING_RESPONSE',
      'RESPONSE_RECEIVED',
      'CLOSED'
    );

    ALTER TABLE report
      ALTER COLUMN communication_status DROP DEFAULT,
      ALTER COLUMN communication_status TYPE communication_status_enum
        USING communication_status::text::communication_status_enum,
      ALTER COLUMN communication_status SET DEFAULT 'NOT_STARTED';

    DROP TYPE communication_status_enum_old;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    // Puts OPEN back on the type. Which rows used to be OPEN is not recoverable
    // — they were folded into AWAITING_RESPONSE on the way up — so no row is
    // moved back.
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TYPE communication_status_enum
      RENAME TO communication_status_enum_new;

    CREATE TYPE communication_status_enum AS ENUM (
      'NOT_STARTED',
      'OPEN',
      'AWAITING_RESPONSE',
      'RESPONSE_RECEIVED',
      'CLOSED'
    );

    ALTER TABLE report
      ALTER COLUMN communication_status DROP DEFAULT,
      ALTER COLUMN communication_status TYPE communication_status_enum
        USING communication_status::text::communication_status_enum,
      ALTER COLUMN communication_status SET DEFAULT 'NOT_STARTED';

    DROP TYPE communication_status_enum_new;

    COMMIT;
    `)
  },
}
