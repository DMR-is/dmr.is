'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- Vendor clients and per-company delegation for the partner API.
    --
    -- doe_api_key is one company per key (company_id NOT NULL), which
    -- is right for an employer integrating its own payroll system and
    -- wrong for an accounting firm filing for 100+ clients: that would
    -- be 100 credentials to store and rotate, and 100 employers each
    -- copying a secret into the firm's product.
    --
    -- So a firm gets a client (who is calling), credentials of its own
    -- (how it proves it), and one delegation row per company that has
    -- allowed it to act for them (on whose behalf). Credential and
    -- delegation stay separate objects so both revocations exist: cut
    -- the firm off entirely, or one employer withdraws.
    --
    -- New tables rather than a nullable doe_api_key.company_id: the
    -- partner API relies on that column being absolute. A missing
    -- company there is a broken foreign key, not a new customer, and
    -- that should stay true of the table that authenticates every
    -- request.
    -- ============================================================

    -- The firm. Created by a DoE admin: approving an intermediary is a
    -- commercial decision by Jafnréttisstofa, not something a vendor
    -- does to itself, so there is no self-service path to this row.
    CREATE TABLE doe_partner_client (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      -- The firm's kennitala. Not a company FK: the firm is recorded
      -- here as an intermediary, whether or not it is also an employer
      -- in the register. It is how the firm is recognised when it signs
      -- in to the self-service web to collect its credentials.
      national_id TEXT NOT NULL,
      name TEXT NOT NULL,

      -- The ceiling on what this firm may ever do. A request's effective
      -- scopes are this intersected with the delegation's.
      scopes TEXT[] NOT NULL,

      created_by_user_id UUID NOT NULL REFERENCES doe_user(id),

      revoked_at TIMESTAMPTZ DEFAULT NULL,
      revoked_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      revoked_reason TEXT DEFAULT NULL,

      -- Same shape as doe_api_key_revoked_chk: metadata only on a
      -- revoked row, and a revoked row may name no actor so a future
      -- system-initiated revocation is not blocked here.
      CONSTRAINT doe_partner_client_revoked_chk CHECK (
        revoked_at IS NOT NULL
        OR (revoked_by_user_id IS NULL AND revoked_reason IS NULL)
      ),

      CONSTRAINT doe_partner_client_scopes_not_empty_chk CHECK (
        cardinality(scopes) > 0
      )
    );

    -- One live client per firm. Partial, so a revoked client stays as
    -- audit and a re-approved firm gets a fresh row — which also means
    -- its companies must consent again: their delegations name the old
    -- client row.
    --
    -- Revoking a client does NOT stamp its keys or delegations; they keep
    -- their own revoked_at as their own audit trail. So a key or a
    -- delegation is live iff its own revoked_at AND its client's
    -- revoked_at are both NULL, and every reader must check both.
    CREATE UNIQUE INDEX doe_partner_client_national_id_active_uq
      ON doe_partner_client (national_id)
      WHERE revoked_at IS NULL;

    -- The firm's credentials, several per client for the same reason
    -- doe_api_key allows several per company: rotation without downtime
    -- is issue the replacement, deploy, then revoke the incumbent.
    -- Carries no scopes — a key is the client, and the client's scopes
    -- are the ones that count.
    CREATE TABLE doe_partner_client_key (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      partner_client_id UUID NOT NULL REFERENCES doe_partner_client(id),

      -- Public half of the credential and the lookup key on every
      -- authenticated request. Unique within this table; the key's
      -- prefix is what routes a presented credential here rather than
      -- to doe_api_key.
      key_id TEXT NOT NULL UNIQUE,
      secret_hash TEXT NOT NULL,

      label TEXT DEFAULT NULL,

      -- ISLAND_IS: the firm minted it on the self-service web, signed in
      -- as itself. ADMIN: a reviewer issued it as a fallback. Reuses the
      -- doe_api_key enum because the two paths and their actors are the
      -- same ones.
      created_via doe_api_key_origin_enum NOT NULL,
      created_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      created_by_national_id TEXT DEFAULT NULL,

      expires_at TIMESTAMPTZ DEFAULT NULL,

      -- Activity indicator, written at most once a minute per key.
      last_used_at TIMESTAMPTZ DEFAULT NULL,

      revoked_at TIMESTAMPTZ DEFAULT NULL,
      revoked_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      revoked_by_national_id TEXT DEFAULT NULL,
      revoked_reason TEXT DEFAULT NULL,

      CONSTRAINT doe_partner_client_key_created_actor_chk CHECK (
        (
          created_via = 'ADMIN'
          AND created_by_user_id IS NOT NULL
          AND created_by_national_id IS NULL
        )
        OR (
          created_via = 'ISLAND_IS'
          AND created_by_national_id IS NOT NULL
          AND created_by_user_id IS NULL
        )
      ),

      CONSTRAINT doe_partner_client_key_revoked_chk CHECK (
        (
          revoked_at IS NULL
          AND revoked_by_user_id IS NULL
          AND revoked_by_national_id IS NULL
          AND revoked_reason IS NULL
        )
        OR (
          revoked_at IS NOT NULL
          AND NOT (
            revoked_by_user_id IS NOT NULL
            AND revoked_by_national_id IS NOT NULL
          )
        )
      )
    );

    -- The self-service and admin paths: list one client's keys.
    CREATE INDEX doe_partner_client_key_partner_client_id_idx
      ON doe_partner_client_key (partner_client_id);

    -- A company allowing a firm to act for it. Granted by the company
    -- on the self-service web, behind island.is login with the company
    -- chosen in IDS — so the row records a witnessed act, not the
    -- firm's claim that the employer consented.
    --
    -- Lasts until the company turns it off: no expiry column.
    -- Makes (id, national_id) referenceable for the composite foreign key
    -- on doe_partner_delegation. national_id is already UNIQUE on its own,
    -- so this adds no rule, only a target.
    ALTER TABLE company
      ADD CONSTRAINT company_id_national_id_uq UNIQUE (id, national_id);

    CREATE TABLE doe_partner_delegation (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      partner_client_id UUID NOT NULL REFERENCES doe_partner_client(id),
      company_id UUID NOT NULL,

      -- Denormalised from company.national_id so the partner API resolves
      -- the delegation from the request header with one indexed read and
      -- no join. Pinned to company_id by the composite foreign key below,
      -- so the column the guard looks up by and the column the consent
      -- screens scope by cannot name two different companies — whatever
      -- a future writer gets wrong.
      company_national_id TEXT NOT NULL,

      -- What this employer allowed. scoring:write is here only if the
      -- company ticked it: the firm supplies the UI, but each company
      -- authors its own starfsmat through it.
      scopes TEXT[] NOT NULL,

      -- The person who granted it: user.actor.nationalId under a
      -- procuration login. There is no doe_user row for them, the same
      -- as a self-service doe_api_key. The grant time is created_at.
      granted_by_national_id TEXT NOT NULL,

      revoked_at TIMESTAMPTZ DEFAULT NULL,
      revoked_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      revoked_by_national_id TEXT DEFAULT NULL,

      CONSTRAINT doe_partner_delegation_revoked_chk CHECK (
        (
          revoked_at IS NULL
          AND revoked_by_user_id IS NULL
          AND revoked_by_national_id IS NULL
        )
        OR (
          revoked_at IS NOT NULL
          AND NOT (
            revoked_by_user_id IS NOT NULL
            AND revoked_by_national_id IS NOT NULL
          )
        )
      ),

      CONSTRAINT doe_partner_delegation_scopes_not_empty_chk CHECK (
        cardinality(scopes) > 0
      ),

      CONSTRAINT doe_partner_delegation_company_fk
        FOREIGN KEY (company_id, company_national_id)
        REFERENCES company (id, national_id)
    );

    -- One live delegation per (firm, company), and the partner API's
    -- authentication lookup: client from the credential, kennitala from
    -- X-Company-National-Id. Partial, so toggling a delegation off and
    -- on again leaves the earlier grant as audit rather than
    -- overwriting who granted it and when.
    CREATE UNIQUE INDEX doe_partner_delegation_active_uq
      ON doe_partner_delegation (partner_client_id, company_national_id)
      WHERE revoked_at IS NULL;

    -- The self-service path: list the delegations one company granted.
    CREATE INDEX doe_partner_delegation_company_id_idx
      ON doe_partner_delegation (company_id);

    -- Which firm filed a report. provider_type/provider_id record the
    -- channel and the caller's id, but nothing names the firm, and for
    -- a regulator "who actually submitted this" is the audit question.
    -- Added with the tables because provenance never recorded cannot be
    -- backfilled. Null for every report not filed under a client key.
    ALTER TABLE report
      ADD COLUMN partner_client_id UUID DEFAULT NULL
        REFERENCES doe_partner_client(id);

    -- "Which reports did this firm file", and the FK check on a client
    -- row. Partial, like the table's other nullable FKs would want: almost
    -- every report has none.
    CREATE INDEX report_partner_client_id_idx
      ON report (partner_client_id)
      WHERE partner_client_id IS NOT NULL;

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    ALTER TABLE report DROP COLUMN IF EXISTS partner_client_id;
    DROP TABLE IF EXISTS doe_partner_delegation;
    ALTER TABLE company DROP CONSTRAINT IF EXISTS company_id_national_id_uq;
    DROP TABLE IF EXISTS doe_partner_client_key;
    DROP TABLE IF EXISTS doe_partner_client;

    COMMIT;
    `)
  },
}
