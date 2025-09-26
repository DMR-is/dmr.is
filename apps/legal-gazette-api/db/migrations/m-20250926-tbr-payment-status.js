'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE TBR_TRANSACTION ADD COLUMN PAID_AT TIMESTAMPTZ DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE TBR_TRANSACTION DROP COLUMN IF EXISTS PAID_AT;

      COMMIT;
    `)
  },
}
