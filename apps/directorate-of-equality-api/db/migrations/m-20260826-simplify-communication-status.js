'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize
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
    // recreated and the column swapped onto it. This follows the shape
    // m-20260624 was rewritten into after an incident: ONE `sql.transaction()`
    // that Sequelize actually knows about (a literal `BEGIN;` in a query string
    // leaves it unaware, so nothing issues a real ROLLBACK), plus pg_catalog
    // guards so the migration is idempotent and converges from a half-applied
    // state instead of wedging on the rename.
    // ============================================================
    await sql.transaction(async (transaction) => {
      const run = (text) => sql.query(text, { transaction })

      // 1. Fold any lingering OPEN rows into AWAITING_RESPONSE. The `::text`
      //    comparison never coerces the literal into the enum, so it is safe on
      //    a database whose type has no OPEN label — a checkout rebuilt from a
      //    dump, or a second run of this migration. Written the obvious way
      //    (communication_status = 'OPEN') Postgres raises "invalid input value
      //    for enum" there instead.
      await run(`
        UPDATE report
          SET communication_status = 'AWAITING_RESPONSE'
          WHERE communication_status::text = 'OPEN';
      `)

      // 2. Converge the enum to the four-value shape and repoint the column.
      //    Handles a fresh DB, an already-migrated DB, and a DB left with an
      //    orphan `_old` type by an earlier interrupted run.
      //
      //    report.communication_status is the only column on this type, and it
      //    carries a NOT NULL DEFAULT that has to be dropped and restored
      //    around the swap (the default is typed, so it blocks the ALTER).
      await run(`
        DO $$
        BEGIN
          -- (a) If the live enum still has OPEN, rename it aside and build a
          --     clean one. A stray _old here means an earlier run left an
          --     inconsistent state we shouldn't silently steamroll.
          IF EXISTS (
            SELECT 1 FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'communication_status_enum' AND e.enumlabel = 'OPEN'
          ) THEN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_status_enum_old') THEN
              RAISE EXCEPTION 'communication_status_enum_old already exists alongside a live OPEN enum; resolve partial migration state manually';
            END IF;
            ALTER TYPE communication_status_enum RENAME TO communication_status_enum_old;
            CREATE TYPE communication_status_enum AS ENUM (
              'NOT_STARTED',
              'AWAITING_RESPONSE',
              'RESPONSE_RECEIVED',
              'CLOSED'
            );
          END IF;

          -- (b) Repoint the column off the old type onto the rebuilt enum, then
          --     drop the old type. Runs right after (a), or on its own to
          --     finish an interrupted prior run.
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_status_enum_old') THEN
            ALTER TABLE report ALTER COLUMN communication_status DROP DEFAULT;
            ALTER TABLE report
              ALTER COLUMN communication_status TYPE communication_status_enum
                USING communication_status::text::communication_status_enum;
            ALTER TABLE report ALTER COLUMN communication_status SET DEFAULT 'NOT_STARTED';
            DROP TYPE communication_status_enum_old;
          END IF;
        END $$;
      `)
    })
  },

  async down(queryInterface) {
    // Re-add OPEN as a legal value. Data is NOT restored — the up folded every
    // OPEN row into AWAITING_RESPONSE and that mapping is not reversible.
    // `ADD VALUE` must run outside a transaction (Postgres forbids referencing
    // a value added in the same transaction), so it stands alone here, and
    // `IF NOT EXISTS` makes it re-runnable. This replaces the full type rebuild
    // the reversal used to do: rewriting the table to put one label back is a
    // lot of moving parts for an operation Postgres supports directly.
    await queryInterface.sequelize.query(
      `ALTER TYPE communication_status_enum ADD VALUE IF NOT EXISTS 'OPEN' AFTER 'NOT_STARTED';`,
    )
  },
}
