'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- GIN index for JSONB queries on ANSWERS column (path operations)
      CREATE INDEX IF NOT EXISTS idx_application_answers_path
        ON APPLICATION USING gin (ANSWERS jsonb_path_ops);

      -- Index for applicant national ID lookups (most common - who the application is about)
      CREATE INDEX IF NOT EXISTS idx_application_applicant_national_id
        ON APPLICATION(APPLICANT_NATIONAL_ID);

      -- Index for submitter national ID lookups (who submitted the application)
      CREATE INDEX IF NOT EXISTS idx_application_submitted_by_national_id
        ON APPLICATION(SUBMITTED_BY_NATIONAL_ID)
        WHERE SUBMITTED_BY_NATIONAL_ID IS NOT NULL;

      -- Index for status filtering
      CREATE INDEX IF NOT EXISTS idx_application_status
        ON APPLICATION(STATUS);

      -- Index for application type filtering
      CREATE INDEX IF NOT EXISTS idx_application_type
        ON APPLICATION(APPLICATION_TYPE);

      -- Composite index for date range queries with sorting
      CREATE INDEX IF NOT EXISTS idx_application_created_at_id
        ON APPLICATION(CREATED_AT DESC, ID);

      -- Composite index for user queries (most common filter combination)
      CREATE INDEX IF NOT EXISTS idx_application_user_queries
        ON APPLICATION(APPLICANT_NATIONAL_ID, STATUS, APPLICATION_TYPE, CREATED_AT DESC)
        WHERE DELETED_AT IS NULL;

      -- Index for case lookups
      CREATE INDEX IF NOT EXISTS idx_application_case_id
        ON APPLICATION(CASE_ID);

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_application_answers_path;
      DROP INDEX IF EXISTS idx_application_applicant_national_id;
      DROP INDEX IF EXISTS idx_application_submitted_by_national_id;
      DROP INDEX IF EXISTS idx_application_status;
      DROP INDEX IF EXISTS idx_application_type;
      DROP INDEX IF EXISTS idx_application_created_at_id;
      DROP INDEX IF EXISTS idx_application_user_queries;
      DROP INDEX IF EXISTS idx_application_case_id;

      COMMIT;
    `)
  },
}
