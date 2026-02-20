'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE MONTLY_ISSUES (
        ID SERIAL PRIMARY KEY,
        DEPARTMENT_ID INTEGER NOT NULL,
        START_DATE DATE NOT NULL,
        END_DATE DATE NOT NULL,
        TITLE TEXT NOT NULL,
        URL TEXT NOT NULL,
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE
      );

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE MONTLY_ISSUES;

      COMMIT;
    `)
  },
}
