'use strict'

/**
 * Creates the job_runs table for distributed task locking.
 * Used by PgAdvisoryLockService to track when jobs last ran,
 * preventing duplicate runs within a cooldown window.
 */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS job_runs (
        job_key INTEGER PRIMARY KEY,
        last_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
        container_id TEXT
      );

      COMMENT ON TABLE job_runs IS 'Tracks distributed task execution to prevent duplicate runs';
      COMMENT ON COLUMN job_runs.job_key IS 'Unique identifier for the job type (from TASK_JOB_IDS)';
      COMMENT ON COLUMN job_runs.last_run_at IS 'Timestamp when the job last ran';
      COMMENT ON COLUMN job_runs.container_id IS 'Container/pod ID that ran the job (for debugging)';

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;
      DROP TABLE IF EXISTS job_runs;
      COMMIT;
    `)
  },
}
