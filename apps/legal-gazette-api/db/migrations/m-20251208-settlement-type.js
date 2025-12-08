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
        ADD COLUMN IF NOT EXISTS TYPE SETTLEMENT_TYPE DEFAULT 'DEFAULT' NOT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE SIGNATURE
        DROP COLUMN IF EXISTS ADVERT_ID;

      COMMIT;
    `)
  },
}
