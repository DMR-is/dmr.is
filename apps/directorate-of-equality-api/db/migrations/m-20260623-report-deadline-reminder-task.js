'use strict'

/**
 * Infrastructure for the report-deadline-reminder task:
 *
 * 1. `job_runs` — the distributed-lock bookkeeping table used by
 *    AdvisoryLockService (@dmr.is/shared-modules) to prevent duplicate runs
 *    across multiple API containers within a cooldown window.
 *
 * 2. Two new company_event types recorded when a 6-months-before reminder is
 *    sent, one per deadline. The due date being reminded about is stored in
 *    `reason` (ISO date) so the task is idempotent per cycle: a new due date
 *    yields a new event and re-arms the reminder.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE must be committed before the new value can be
    // referenced (Postgres forbids using it in the same transaction), so each
    // runs on its own, outside any transaction block.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'EQUALITY_REPORT_DEADLINE_REMINDER_SENT';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'SALARY_REPORT_DEADLINE_REMINDER_SENT';
    `)

    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS job_runs (
        job_key INTEGER PRIMARY KEY,
        last_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
        container_id TEXT
      );

      COMMENT ON TABLE job_runs IS 'Tracks distributed task execution to prevent duplicate runs';
      COMMENT ON COLUMN job_runs.job_key IS 'Unique identifier for the job type (from DOE_TASK_JOB_IDS)';
      COMMENT ON COLUMN job_runs.last_run_at IS 'Timestamp when the job last ran';
      COMMENT ON COLUMN job_runs.container_id IS 'Container/pod ID that ran the job (for debugging)';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Postgres has no DROP VALUE — the two enum values are left in place
    // (removing them would require recreating company_event_type_enum and
    // rewriting every dependent row). Only the job_runs table is dropped.
    await queryInterface.sequelize.query(`
      BEGIN;
      DROP TABLE IF EXISTS job_runs;
      COMMIT;
    `)
  },
}
