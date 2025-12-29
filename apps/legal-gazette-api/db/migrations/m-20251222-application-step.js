'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE APPLICATION
        ADD COLUMN IF NOT EXISTS CURRENT_STEP INTEGER DEFAULT 0 NOT NULL,
        ADD COLUMN IF NOT EXISTS APPLICANT_NATIONAL_ID VARCHAR(10),
        ALTER COLUMN SUBMITTED_BY_NATIONAL_ID DROP NOT NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE APPLICATION
        DROP COLUMN IF EXISTS CURRENT_STEP,
        DROP COLUMN IF EXISTS APPLICANT_NATIONAL_ID,
        ALTER COLUMN SUBMITTED_BY_NATIONAL_ID SET NOT NULL;

      COMMIT;
    `)
  },
}
