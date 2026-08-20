'use strict'

/**
 * Adds the two overdue milestones that are served into the company's island.is
 * mailbox (Pósthólfið) rather than emailed:
 *
 *   OVERDUE_NOTICE  — "Áminning á að skilafrestur er útrunninn"
 *   FINES_PRECURSOR — "Undanfari á dagsektum"
 *
 * plus their event types, and the unique index that makes `company_event` safe to
 * use as the issuance registry the Skjalaveita callback authorises against.
 *
 * ## The index is the substantive part
 *
 * The reminder task checks for an existing event and then inserts one. Nothing
 * enforced that pair before: the initial migration adds three non-unique indexes
 * on company_event (company_id, actor_user_id, (company_id, created_at)) and
 * m-20260629 adds only the reminder_tier column. Two containers racing the
 * check-then-insert therefore cost a duplicate — which was a duplicate *email*,
 * and is now a duplicate *legal notice*.
 *
 * The partial index below closes that and doubles as the lookup index the
 * callback needs; none of the three existing indexes covers
 * (company_id, event_type, reminder_tier, reason).
 *
 * It is partial on `reminder_tier IS NOT NULL` because every non-reminder event
 * (CREATED, STATUS_CHANGED, FINES_*, QUARANTINE*) leaves the column null, and
 * those legitimately repeat — a company can be quarantined and unquarantined any
 * number of times with the same null tier and the same reason.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE must be committed before the new value can be
    // referenced (Postgres forbids using it in the same transaction), so each
    // runs on its own, outside any transaction block. Mirrors
    // m-20260623-report-deadline-reminder-task.js.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_reminder_tier_enum
        ADD VALUE IF NOT EXISTS 'OVERDUE_NOTICE';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_reminder_tier_enum
        ADD VALUE IF NOT EXISTS 'FINES_PRECURSOR';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'EQUALITY_MAILBOX_NOTICE_SENT';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum
        ADD VALUE IF NOT EXISTS 'SALARY_MAILBOX_NOTICE_SENT';
    `)

    // CREATE UNIQUE INDEX (non-concurrently) takes an ACCESS EXCLUSIVE lock for
    // the duration. company_event is append-only and small, so that is a brief
    // pause rather than an outage; CONCURRENTLY cannot run inside a transaction
    // and would need its own failure handling for an INVALID index.
    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE UNIQUE INDEX IF NOT EXISTS company_event_reminder_dedup_uidx
        ON company_event (company_id, event_type, reminder_tier, reason)
        WHERE reminder_tier IS NOT NULL;

      COMMENT ON INDEX company_event_reminder_dedup_uidx IS
        'Idempotency key for deadline reminders and mailbox notices: one row per (company, event type, tier, due date). Also the lookup index for the Skjalaveita callback.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    // Postgres has no DROP VALUE — the four enum values are left in place
    // (removing them would require recreating both types and rewriting every
    // dependent row). Only the index is dropped.
    await queryInterface.sequelize.query(`
      BEGIN;
      DROP INDEX IF EXISTS company_event_reminder_dedup_uidx;
      COMMIT;
    `)
  },
}
