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

    // 1. Collapse existing data while UNKNOWN is still a legal value.
    await sql.query(
      `UPDATE company SET status = 'INACTIVE' WHERE status = 'UNKNOWN';`,
    )
    await sql.query(
      `UPDATE company_event SET status = 'INACTIVE' WHERE status = 'UNKNOWN';`,
    )
    await sql.query(
      `UPDATE company_event SET from_status = 'INACTIVE' WHERE from_status = 'UNKNOWN';`,
    )
    await sql.query(
      `UPDATE company_event SET to_status = 'INACTIVE' WHERE to_status = 'UNKNOWN';`,
    )

    // 2. Rebuild the enum without UNKNOWN.
    await sql.query(
      `ALTER TYPE company_status_enum RENAME TO company_status_enum_old;`,
    )
    await sql.query(`CREATE TYPE company_status_enum AS ENUM ('ACTIVE', 'INACTIVE');`)

    // 3. Repoint every dependent column. company.status carries a DEFAULT that
    //    must be dropped before the type swap and restored after.
    await sql.query(`ALTER TABLE company ALTER COLUMN status DROP DEFAULT;`)
    await sql.query(
      `ALTER TABLE company ALTER COLUMN status TYPE company_status_enum USING status::text::company_status_enum;`,
    )
    await sql.query(`ALTER TABLE company ALTER COLUMN status SET DEFAULT 'ACTIVE';`)
    await sql.query(
      `ALTER TABLE company_event ALTER COLUMN status TYPE company_status_enum USING status::text::company_status_enum;`,
    )
    await sql.query(
      `ALTER TABLE company_event ALTER COLUMN from_status TYPE company_status_enum USING from_status::text::company_status_enum;`,
    )
    await sql.query(
      `ALTER TABLE company_event ALTER COLUMN to_status TYPE company_status_enum USING to_status::text::company_status_enum;`,
    )

    // 4. Drop the old type.
    await sql.query(`DROP TYPE company_status_enum_old;`)
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
