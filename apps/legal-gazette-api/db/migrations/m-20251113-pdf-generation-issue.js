'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE DOCUMENT_ISSUES (
        ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE,
        
        PUBLISH_DATE TIMESTAMP WITH TIME ZONE NOT NULL,
        TITLE TEXT,
        URL TEXT,
        ISSUE INTEGER,
        YEAR INTEGER,
        RUNNING_PAGE_NUMBER INTEGER
      );

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE IF EXISTS DOCUMENT_ISSUES;

      COMMIT;
    `)
  },
}
