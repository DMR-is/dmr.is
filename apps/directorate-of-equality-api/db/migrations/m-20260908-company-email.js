'use strict'

/**
 * Custom admin emails to companies.
 *
 * Three tables plus two additions to `company_event`, backing the "senda
 * tölvupóst" flow on the company detail and company list screens.
 *
 * ## Why the recipients are a table and not a re-run of the filter
 *
 * A bulk send is addressed by the same filter the company list uses, and it can
 * match the whole register. The obvious implementation — resolve the filter
 * inside the sending loop — is wrong in three ways at once, and
 * `company_email_recipient` exists to close all three:
 *
 *   1. The register moves. A company edited while a send is running would join
 *      or leave the batch after the admin had already approved a count.
 *   2. A restart would re-run the filter and re-mail everyone already written to.
 *      Rows carry their own status, so a resume knows precisely what is left.
 *   3. There would be nowhere to record a per-recipient failure, which is the
 *      outcome an admin most needs to see.
 *
 * `company_name` and `email` are snapshots on purpose. Correcting a company's
 * address next week must not rewrite the record of where last week's mail went.
 *
 * ## Why attachments hang off the batch, not the recipient
 *
 * One row per file per *message*. `company_file` keys documents under the owning
 * company, which is right for an approval — one company, one PDF — but a
 * 1 700-recipient send would write 1 700 copies of the same 5MB file. An
 * attachment is a property of the message, and each company reaches it through
 * its timeline event → batch → attachment.
 *
 * `s3_key` moves once: it points at the transient staging prefix
 * (`doe-imports/mail-attachment/…`) while the batch is queued and sending, and
 * at `company-emails/{id}/…` in the company-files bucket afterwards. `archived`
 * says which. ⚠️ A permanently false row is a real state, not a bug — when
 * `AWS_DOE_COMPANY_FILES_BUCKET` is unset the move is skipped and the staged
 * object is deliberately kept, so the one durable copy is never destroyed.
 *
 * ## `company_event.company_email_id`
 *
 * Nullable, and null for every event type but the three CUSTOM_EMAIL_* ones. It
 * is what lets a timeline entry open into the message that was actually sent
 * rather than only asserting that something was. `ON DELETE SET NULL`: the
 * timeline entry is the audit record and must outlive a deleted batch, even
 * having lost the body it pointed at.
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

    /*
     * The three CUSTOM_EMAIL_* values are deliberately left on
     * company_event_type_enum.
     *
     * Postgres cannot drop an enum value, so removing them means recreating the
     * type — which the earlier fines/quarantine migration does by DELETEing the
     * rows that use them first. That is acceptable for a value added and rolled
     * back in one deploy; it is not acceptable here, because these rows are the
     * audit record of mail that was genuinely sent to companies. Destroying that
     * to tidy up a type is the wrong trade, and an unused enum value costs
     * nothing.
     */
  },
}
