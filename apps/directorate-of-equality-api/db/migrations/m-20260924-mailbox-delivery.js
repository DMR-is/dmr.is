'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Notices delivered to a company's island.is Stafrænt pósthólf
    -- through Jafnréttisstofa's case system, One (OneExternalAPI).
    --
    -- One delivery is up to three calls: CreateCase, CreateDocument,
    -- SendDocToIslandIs. None is documented as idempotent, and the last
    -- two really are not: repeating them files or sends a second copy.
    -- So each id One hands back is saved the moment it arrives, and a
    -- resume skips every step whose id is already here.
    --
    -- Its own mutable table because company_event is insert-only; the
    -- timeline can say that a notice went out, but not hold the state
    -- of one that is halfway there.
    --
    -- The PDF is not stored. One keeps the bytes; this keeps a hash and
    -- a size, so what was sent can be recognised if it is re-rendered.
    -- ============================================================

    CREATE TYPE mailbox_delivery_kind_enum AS ENUM (
      'OVERDUE_NOTICE', 'FINES_PRECURSOR'
    );

    CREATE TYPE mailbox_delivery_status_enum AS ENUM (
      'PENDING', 'CASE_CREATED', 'DOCUMENT_CREATED', 'SENT', 'FAILED', 'UNCERTAIN'
    );

    -- The non-idempotent call in progress. CreateCase has no value: One
    -- finds-or-creates the case, so repeating it is harmless.
    CREATE TYPE mailbox_delivery_step_enum AS ENUM (
      'CREATE_DOCUMENT', 'SEND_DOC_TO_ISLAND_IS'
    );

    CREATE TABLE mailbox_delivery (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

      company_id UUID NOT NULL,

      -- The recipient's kennitala as it was sent to One, which is the
      -- mailbox the notice lands in. Pinned to company_id by the
      -- composite foreign key below, so the two cannot name different
      -- companies.
      national_id TEXT NOT NULL,

      kind mailbox_delivery_kind_enum NOT NULL,

      -- Chosen by the caller, e.g. one per company per notice per
      -- period. The second call with the same key finds this row and
      -- resumes it instead of starting another delivery.
      idempotency_key TEXT NOT NULL,

      subject TEXT NOT NULL,

      status mailbox_delivery_status_enum NOT NULL DEFAULT 'PENDING',

      -- Written just before CreateDocument or SendDocToIslandIs and
      -- cleared once the outcome is recorded. Still set when the row is
      -- next claimed means the process died mid-call: the outcome is
      -- unknown and the row becomes UNCERTAIN.
      in_flight_step mailbox_delivery_step_enum DEFAULT NULL,

      -- What One and island.is returned, each saved as it arrives and
      -- never overwritten (writers require the column to be NULL).
      -- one_case_number is the human-facing case number, one_case_item_id
      -- the id CreateDocument files under.
      one_case_number TEXT DEFAULT NULL,
      one_case_item_id TEXT DEFAULT NULL,
      one_document_item_id TEXT DEFAULT NULL,
      island_is_document_id TEXT DEFAULT NULL,

      -- Lowercase hex SHA-256 of the PDF as sent, and its length.
      pdf_sha256 TEXT DEFAULT NULL,
      pdf_size_bytes INTEGER DEFAULT NULL,

      attempts INTEGER NOT NULL DEFAULT 0,
      last_attempt_at TIMESTAMPTZ DEFAULT NULL,
      -- One's ErrorMessage (or the transport error) and ErrorNumber from
      -- the most recent failure, the message cut to 500 characters. Never
      -- a token or a credential, but One's text may echo the recipient's
      -- kennitala or name: never log it or show it in a UI unfiltered.
      last_error TEXT DEFAULT NULL,
      last_error_number TEXT DEFAULT NULL,

      -- A worker's claim on the row. Taken with one conditional UPDATE
      -- rather than FOR UPDATE, which would hold a connection open across
      -- the calls to One. An expired lease is free to take.
      lease_token UUID DEFAULT NULL,
      lease_expires_at TIMESTAMPTZ DEFAULT NULL,

      sent_at TIMESTAMPTZ DEFAULT NULL,

      CONSTRAINT mailbox_delivery_idempotency_key_uq UNIQUE (idempotency_key),

      -- No ON DELETE: this records mail that reached a real mailbox, and
      -- deleting the company must not quietly erase that.
      CONSTRAINT mailbox_delivery_company_fk
        FOREIGN KEY (company_id, national_id)
        REFERENCES company (id, national_id),

      -- A forward status never outruns the ids it stands for. Cumulative,
      -- because a document cannot exist without its case, nor a send
      -- without its document. FAILED and UNCERTAIN carry whatever ids
      -- were saved before the failure, so they are unconstrained.
      CONSTRAINT mailbox_delivery_case_created_chk CHECK (
        status <> 'CASE_CREATED'
        OR one_case_item_id IS NOT NULL
      ),
      CONSTRAINT mailbox_delivery_document_created_chk CHECK (
        status <> 'DOCUMENT_CREATED'
        OR (
          one_case_item_id IS NOT NULL
          AND one_document_item_id IS NOT NULL
        )
      ),
      -- island_is_document_id is not required: the spec makes the
      -- response ItemID nullable, and One may confirm a send without
      -- one. sent_at is what says a row was sent.
      CONSTRAINT mailbox_delivery_sent_chk CHECK (
        status <> 'SENT'
        OR (
          one_case_item_id IS NOT NULL
          AND one_document_item_id IS NOT NULL
          AND sent_at IS NOT NULL
        )
      ),

      -- A settled row has no call in flight: every writer that sets SENT
      -- or UNCERTAIN clears the marker in the same statement.
      CONSTRAINT mailbox_delivery_in_flight_settled_chk CHECK (
        in_flight_step IS NULL
        OR status NOT IN ('SENT', 'UNCERTAIN')
      ),

      -- A send cannot be in flight without the document it sends.
      CONSTRAINT mailbox_delivery_in_flight_send_chk CHECK (
        in_flight_step IS DISTINCT FROM 'SEND_DOC_TO_ISLAND_IS'
        OR one_document_item_id IS NOT NULL
      ),

      -- Both or neither. The IS NOT NULLs are load-bearing: without them
      -- a NULL in either column makes the second branch NULL, and a CHECK
      -- lets NULL through.
      CONSTRAINT mailbox_delivery_pdf_chk CHECK (
        (pdf_sha256 IS NULL AND pdf_size_bytes IS NULL)
        OR (
          pdf_sha256 IS NOT NULL
          AND pdf_size_bytes IS NOT NULL
          AND pdf_sha256 ~ '^[0-9a-f]{64}$'
          AND pdf_size_bytes > 0
        )
      ),

      CONSTRAINT mailbox_delivery_lease_chk CHECK (
        (lease_token IS NULL) = (lease_expires_at IS NULL)
      ),

      CONSTRAINT mailbox_delivery_attempts_chk CHECK (attempts >= 0)
    );

    -- Nothing reads this yet. It is for the first queue query: the
    -- retry scan over rows not yet SENT (FAILED and the unfinished
    -- forward states), and the operator's list of UNCERTAIN rows.
    -- Partial because SENT is where almost every row ends up.
    CREATE INDEX mailbox_delivery_status_idx
      ON mailbox_delivery (status)
      WHERE status <> 'SENT';

    -- "What has been sent to this company", and the FK check on a
    -- company row.
    CREATE INDEX mailbox_delivery_company_id_idx
      ON mailbox_delivery (company_id);

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TABLE IF EXISTS mailbox_delivery;

    DROP TYPE IF EXISTS mailbox_delivery_step_enum;
    DROP TYPE IF EXISTS mailbox_delivery_status_enum;
    DROP TYPE IF EXISTS mailbox_delivery_kind_enum;

    COMMIT;
    `)
  },
}
