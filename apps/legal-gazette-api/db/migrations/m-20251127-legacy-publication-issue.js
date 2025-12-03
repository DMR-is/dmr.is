'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE DOCUMENT_ISSUES
        ADD COLUMN IS_LEGACY BOOLEAN DEFAULT FALSE;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE DOCUMENT_ISSUES
        DROP COLUMN IF EXISTS IS_LEGACY;

      COMMIT;
    `)
  },
}
