'use strict'

/**
 * Custom admin emails to companies: three tables plus two additions to
 * `company_event`.
 *
 * `company_email_recipient` exists rather than re-running the filter in the
 * sending loop, so that the register moving mid-send cannot change who is
 * written to, a resume knows what is left, and a per-recipient failure has
 * somewhere to be recorded. `company_name` and `email` are snapshots: fixing a
 * company's address must not rewrite where last week's mail went.
 *
 * Attachments hang off the batch, not the recipient — a 1700-recipient send
 * would otherwise store 1700 copies of the same file. `s3_key` moves once, from
 * the staging prefix to `company-emails/{id}/…`, and `archived` says which. A
 * permanently false row is a real state: with `AWS_DOE_COMPANY_FILES_BUCKET`
 * unset the move is skipped and the staged object kept as the only copy.
 *
 * `company_event.company_email_id` is null for every type but the three
 * CUSTOM_EMAIL_* ones, and is `ON DELETE SET NULL` — the timeline entry is the
 * audit record and must outlive a deleted batch.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    // ALTER TYPE ... ADD VALUE cannot run inside a transaction, so the enum
    // additions go first and separately from the DDL below.
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'CUSTOM_EMAIL_SENT';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'CUSTOM_EMAIL_FAILED';
    `)
    await queryInterface.sequelize.query(`
      ALTER TYPE company_event_type_enum ADD VALUE IF NOT EXISTS 'CUSTOM_EMAIL_SKIPPED';
    `)

    await queryInterface.sequelize.query(`
      BEGIN;

      CREATE TYPE company_email_status_enum AS ENUM (
        'QUEUED', 'SENDING', 'COMPLETED', 'FAILED'
      );

      CREATE TYPE company_email_recipient_status_enum AS ENUM (
        'PENDING', 'SENT', 'FAILED', 'SKIPPED_NO_EMAIL', 'SKIPPED_QUARANTINED'
      );

      CREATE TABLE IF NOT EXISTS company_email (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        subject TEXT NOT NULL,
        -- Stored already sanitised, which is what makes the preview, the
        -- delivered message and the timeline read-back the same bytes.
        body_html TEXT NOT NULL,
        -- RESTRICT, not SET NULL: who sent a mailing to the register is not
        -- something a user deletion may erase.
        created_by_user_id UUID NOT NULL REFERENCES doe_user(id) ON DELETE RESTRICT,
        status company_email_status_enum NOT NULL DEFAULT 'QUEUED',
        -- The filter as the admin had it, for audit only. Re-running it later
        -- would resolve a different set; what actually received the mail is the
        -- recipient rows.
        filter JSONB,
        completed_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS company_email_created_at_idx
        ON company_email (created_at DESC);

      CREATE TABLE IF NOT EXISTS company_email_recipient (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        company_email_id UUID NOT NULL REFERENCES company_email(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
        -- Snapshots, not projections of the company row. See the header.
        company_name TEXT NOT NULL,
        email TEXT,
        status company_email_recipient_status_enum NOT NULL,
        error TEXT,
        sent_at TIMESTAMPTZ,

        -- One row per company per batch. This is the constraint that makes a
        -- resume safe: a retry cannot insert a second row for a company that
        -- has already been written to.
        CONSTRAINT company_email_recipient_unique
          UNIQUE (company_email_id, company_id)
      );

      -- The sending loop's own query: the pending rows of one batch.
      CREATE INDEX IF NOT EXISTS company_email_recipient_batch_status_idx
        ON company_email_recipient (company_email_id, status);

      CREATE TABLE IF NOT EXISTS company_email_attachment (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        company_email_id UUID NOT NULL REFERENCES company_email(id) ON DELETE CASCADE,
        -- The name the recipient sees, not the S3 key (which is a UUID).
        filename TEXT NOT NULL,
        s3_key TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        archived BOOLEAN NOT NULL DEFAULT FALSE
      );

      CREATE INDEX IF NOT EXISTS company_email_attachment_batch_idx
        ON company_email_attachment (company_email_id);

      ALTER TABLE company_event
        ADD COLUMN IF NOT EXISTS company_email_id UUID
          REFERENCES company_email(id) ON DELETE SET NULL;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE company_event DROP COLUMN IF EXISTS company_email_id;

      DROP TABLE IF EXISTS company_email_attachment;
      DROP TABLE IF EXISTS company_email_recipient;
      DROP TABLE IF EXISTS company_email;

      DROP TYPE IF EXISTS company_email_recipient_status_enum;
      DROP TYPE IF EXISTS company_email_status_enum;

      COMMIT;
    `)

    // The three CUSTOM_EMAIL_* values are left on company_event_type_enum.
    // Postgres cannot drop an enum value, and recreating the type would mean
    // deleting the rows that use it — the audit record of mail genuinely sent.
    // An unused enum value costs nothing.
  },
}
