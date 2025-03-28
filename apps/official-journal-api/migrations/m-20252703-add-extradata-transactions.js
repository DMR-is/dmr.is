'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter CASE_TRANSACTION table
      ALTER TABLE CASE_TRANSACTION ADD COLUMN SUBJECT VARCHAR;
      ALTER TABLE CASE_TRANSACTION ADD COLUMN EXTRA_WORK_COUNT NUMERIC;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

       -- Revert CASE_TRANSACTION table additions
          ALTER TABLE CASE_TRANSACTION DROP COLUMN IF EXISTS SUBJECT;
          ALTER TABLE CASE_TRANSACTION DROP COLUMN IF EXISTS EXTRA_WORK_COUNT;

      COMMIT;
    `)
  },
}
