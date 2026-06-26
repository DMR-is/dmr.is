'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'FINES_STARTED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'FINES_STOPPED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'QUARANTINED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'UNQUARANTINED';
    `)
  },

  async down(queryInterface) {
    // Postgres does not support removing enum values directly.
    // Recreate the enum without the added values and update the column.
    await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE company_event
      ALTER COLUMN event_type TYPE TEXT;

    DELETE FROM company_event
      WHERE event_type IN ('FINES_STARTED', 'FINES_STOPPED', 'QUARANTINED', 'UNQUARANTINED');

    DROP TYPE company_event_type_enum;

    CREATE TYPE company_event_type_enum AS ENUM ('CREATED', 'STATUS_CHANGED');

    ALTER TABLE company_event
      ALTER COLUMN event_type TYPE company_event_type_enum
        USING event_type::company_event_type_enum;

    COMMIT;
    `)
  },
}
