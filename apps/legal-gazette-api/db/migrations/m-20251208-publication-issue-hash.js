'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE DOCUMENT_ISSUES
        ADD COLUMN HASH_ALGORITHM VARCHAR(255) DEFAULT 'SHA-256',
        ADD COLUMN HASH CHAR(64) DEFAULT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE DOCUMENT_ISSUES
        DROP COLUMN IF EXISTS HASH,
        DROP COLUMN IF EXISTS HASH_ALGORITHM;

      COMMIT;
    `)
  },
}
