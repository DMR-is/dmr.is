'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE TBR_TRANSACTION
        ADD COLUMN PAID_AT TIMESTAMPTZ DEFAULT NULL,
        ADD COLUMN CHARGE_CATEGORY VARCHAR(255) NOT NULL,
        ADD COLUMN CHARGE_BASE VARCHAR(255) NOT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE TBR_TRANSACTION
        DROP COLUMN IF EXISTS PAID_AT,
        DROP COLUMN IF EXISTS CHARGE_CATEGORY,
        DROP COLUMN IF EXISTS CHARGE_BASE;

      COMMIT;
    `)
  },
}
