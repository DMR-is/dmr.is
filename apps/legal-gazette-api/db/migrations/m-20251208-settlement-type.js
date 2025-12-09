'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Options can be following:
      -- "Sjálfgefið" -> 'DEFAULT'
      --  "Sat í óskiptu búi" -> 'UNDIVIDED'
      --  "Eigandi samlagsfélags" -> 'OWNER'
      --  Default value is 'DEFAULT'

      CREATE TYPE SETTLEMENT_TYPE AS ENUM ('DEFAULT', 'UNDIVIDED', 'OWNER');

      ALTER TABLE SETTLEMENT
        ADD COLUMN IF NOT EXISTS TYPE SETTLEMENT_TYPE DEFAULT 'DEFAULT' NOT NULL,
        ADD COLUMN IF NOT EXISTS COMPANIES JSONB;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SETTLEMENT
        DROP COLUMN IF EXISTS TYPE,
        DROP COLUMN IF EXISTS COMPANIES;

      DROP TYPE IF EXISTS SETTLEMENT_TYPE;

      COMMIT;
    `)
  },
}
