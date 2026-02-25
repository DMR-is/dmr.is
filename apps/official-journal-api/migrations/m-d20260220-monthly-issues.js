'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE MONTHLY_ISSUES (
        ID UUID NOT NULL DEFAULT UUID_GENERATE_V4(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        DEPARTMENT_ID UUID NOT NULL REFERENCES ADVERT_DEPARTMENT(ID) ON DELETE CASCADE,
        START_DATE DATE NOT NULL,
        END_DATE DATE NOT NULL,
        TITLE TEXT NOT NULL,
        URL TEXT NOT NULL,

        UNIQUE (DEPARTMENT_ID, START_DATE, END_DATE)
      );

      CREATE INDEX idx_monthly_issues_department_id ON MONTHLY_ISSUES (DEPARTMENT_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_monthly_issues_department_id;

      DROP TABLE MONTHLY_ISSUES;

      COMMIT;
    `)
  },
}
