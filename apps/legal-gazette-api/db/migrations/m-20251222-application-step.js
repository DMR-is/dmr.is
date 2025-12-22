'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE APPLICATION
        ADD COLUMN IF NOT EXISTS CURRENT_STEP INTEGER DEFAULT 0 NOT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE APPLICATION
        DROP COLUMN IF EXISTS CURRENT_STEP;

      COMMIT;
    `)
  },
}
