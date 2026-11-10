'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Notices a company is owed: its report was submitted, approved
    -- or denied.
    --
    -- Written in the same transaction as the change that owes the
    -- notice, so the row commits or rolls back with it. doe-api's
    -- dispatcher (a cron) sends it afterwards, by email today and
    -- through One to the island.is mailbox later. Before this table
    -- the approve/deny emails went out from an after-commit hook,
    -- and a process that died after the commit lost the notice with
    -- nothing to retry from.
    --
    -- Every app can write here (the partner API submits reports
    -- too); only doe-api sends.
    --
    -- Ids only. The recipient, the text and the documents are read
    -- from the report when the row is sent.
    -- ============================================================

    CREATE TYPE notice_outbox_kind_enum AS ENUM (
      'REPORT_SUBMITTED', 'REPORT_APPROVED', 'REPORT_DENIED'
    );

    CREATE TYPE notice_outbox_status_enum AS ENUM (
      'PENDING', 'DONE', 'SKIPPED', 'FAILED'
    );

    CREATE TYPE notice_outbox_channel_enum AS ENUM (
      'EMAIL', 'MAILBOX'
    );

    CREATE TABLE notice_outbox (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      kind notice_outbox_kind_enum NOT NULL,

      report_id UUID NOT NULL REFERENCES report(id),

      status notice_outbox_status_enum NOT NULL DEFAULT 'PENDING',

      -- How it was sent. Set when the row is DONE, null otherwise.
      channel notice_outbox_channel_enum DEFAULT NULL,

      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TIMESTAMPTZ DEFAULT NULL,

      -- The dispatcher's own short message, never a provider's
      -- response, so it holds no kennitala, name or address.
      last_error TEXT DEFAULT NULL,

      -- When the row left PENDING.
      processed_at TIMESTAMPTZ DEFAULT NULL,

      -- A report is submitted once and decided once, so a second
      -- row of a kind for one report is a bug. The constraint makes
      -- it fail the transaction that tried, instead of mailing the
      -- company twice. report_id leads so the index also serves
      -- the FK check when a report row is deleted.
      CONSTRAINT notice_outbox_report_kind_uq UNIQUE (report_id, kind),

      CONSTRAINT notice_outbox_done_chk CHECK (
        status <> 'DONE' OR channel IS NOT NULL
      ),
      CONSTRAINT notice_outbox_channel_chk CHECK (
        channel IS NULL OR status = 'DONE'
      ),
      CONSTRAINT notice_outbox_processed_chk CHECK (
        (status = 'PENDING') = (processed_at IS NULL)
      ),
      CONSTRAINT notice_outbox_attempts_chk CHECK (attempts >= 0)
    );

    -- The dispatcher's only query: oldest PENDING first.
    CREATE INDEX notice_outbox_pending_idx
      ON notice_outbox (created_at)
      WHERE status = 'PENDING';

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TABLE IF EXISTS notice_outbox;

    DROP TYPE IF EXISTS notice_outbox_channel_enum;
    DROP TYPE IF EXISTS notice_outbox_status_enum;
    DROP TYPE IF EXISTS notice_outbox_kind_enum;

    COMMIT;
    `)
  },
}
