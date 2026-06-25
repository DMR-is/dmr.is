'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const sql = queryInterface.sequelize
    // The UNKNOWN company status is retired. The annual company import now
    // DEACTIVATES (sets INACTIVE) any company absent from the authoritative
    // register instead of marking it UNKNOWN. Collapse existing UNKNOWN rows
    // into INACTIVE, then rebuild company_status_enum without the value.
    //
    // Postgres has no `ALTER TYPE ... DROP VALUE`, so the enum is recreated:
    // rename the old type, create the new one, repoint every dependent column
    // (company.status + company_event.status/from_status/to_status), then drop
    // the old type.
    //
    // The whole thing runs in ONE transaction and is IDEMPOTENT. None of these
    // statements (unlike `ADD VALUE`) is restricted inside a transaction, so a
    // failure rolls back cleanly and leaves nothing half-applied — the original
    // unwrapped version could die mid-way, commit a partial rebuild, and then
    // be unrunnable forever (the retry hit `invalid input value ... UNKNOWN`
    // because the enum it needed had already been dropped). The pg_catalog
    // guards below also let this converge from such a partial state.
    await sql.transaction(async (transaction) => {
      const run = (text) => sql.query(text, { transaction })

      // 1. Collapse any lingering UNKNOWN rows. The `::text` comparison never
      //    coerces the literal into the enum, so it is safe whether or not
      //    UNKNOWN is still a member (it just matches nothing once it's gone).
      await run(`UPDATE company SET status = 'INACTIVE' WHERE status::text = 'UNKNOWN';`)
      await run(`UPDATE company_event SET status = 'INACTIVE' WHERE status::text = 'UNKNOWN';`)
      await run(`UPDATE company_event SET from_status = 'INACTIVE' WHERE from_status::text = 'UNKNOWN';`)
      await run(`UPDATE company_event SET to_status = 'INACTIVE' WHERE to_status::text = 'UNKNOWN';`)

      // 2. Converge the enum to ('ACTIVE','INACTIVE') and repoint every
      //    dependent column. Handles a fresh DB, an already-applied DB, and a
      //    DB left half-rebuilt by an earlier interrupted run.
      await run(`
        DO $$
        BEGIN
          -- (a) If the live enum still has UNKNOWN, rename it aside and build a
          --     clean one. A stray _old here means an earlier run left an
          --     inconsistent state we shouldn't silently steamroll.
          IF EXISTS (
            SELECT 1 FROM pg_enum e
              JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'company_status_enum' AND e.enumlabel = 'UNKNOWN'
          ) THEN
            IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status_enum_old') THEN
              RAISE EXCEPTION 'company_status_enum_old already exists alongside a live UNKNOWN enum; resolve partial migration state manually';
            END IF;
            ALTER TYPE company_status_enum RENAME TO company_status_enum_old;
            CREATE TYPE company_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
          END IF;

          -- (b) Repoint every column off the old type onto the rebuilt enum,
          --     then drop the old type. Runs whenever an _old type lingers —
          --     i.e. right after (a), or to finish an interrupted prior run.
          --
          --     company.status carries a DEFAULT that must be dropped and
          --     restored around the swap.
          --
          --     The three company_event columns MUST be swapped in a single
          --     ALTER TABLE. company_event_status_changed_chk compares
          --     status = to_status; swapping them one statement at a time
          --     leaves the columns on different enum types mid-way and Postgres
          --     re-checks the constraint with no equality operator across the
          --     two types ("operator does not exist: company_status_enum =
          --     company_status_enum_old"). One statement re-checks the
          --     constraint once, after all three are the new type.
          IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_status_enum_old') THEN
            ALTER TABLE company ALTER COLUMN status DROP DEFAULT;
            ALTER TABLE company ALTER COLUMN status TYPE company_status_enum USING status::text::company_status_enum;
            ALTER TABLE company ALTER COLUMN status SET DEFAULT 'ACTIVE';
            ALTER TABLE company_event
              ALTER COLUMN status TYPE company_status_enum USING status::text::company_status_enum,
              ALTER COLUMN from_status TYPE company_status_enum USING from_status::text::company_status_enum,
              ALTER COLUMN to_status TYPE company_status_enum USING to_status::text::company_status_enum;
            DROP TYPE company_status_enum_old;
          END IF;
        END $$;
      `)
    })
  },

  async down(queryInterface) {
    // Re-add UNKNOWN as a legal value. Data is NOT restored — the up collapsed
    // every UNKNOWN row into INACTIVE and that mapping is not reversible.
    // `ADD VALUE` must run outside a transaction (Postgres forbids referencing
    // a value added in the same transaction), so it stands alone here.
    await queryInterface.sequelize.query(
      `ALTER TYPE company_status_enum ADD VALUE IF NOT EXISTS 'UNKNOWN';`,
    )
  },
}
