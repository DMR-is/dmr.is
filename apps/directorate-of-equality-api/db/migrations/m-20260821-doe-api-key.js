'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    -- ============================================================
    -- API keys for the third-party integration API.
    --
    -- Employers submit through the island.is application system over
    -- X-Road. Payroll and HR vendors submit on their customers' behalf
    -- straight from the internet instead, where there is no IdS session
    -- to authenticate against — hence a machine credential.
    --
    -- A key belongs to exactly ONE company, so this is one-to-many with
    -- the foreign key on the key row. A join table was considered and
    -- rejected: it would permit a single key to authenticate as several
    -- companies, which is the specific property to avoid here.
    --
    -- Several live keys per company is expected, not an edge case:
    -- rotating a credential without downtime means issuing the
    -- replacement before revoking the incumbent.
    --
    -- Only the HMAC of the secret is stored (see api-key.crypto.ts in
    -- @dmr.is/doe-shared, which peppers it with a server-side key). The
    -- plaintext is shown to the issuer once and is unrecoverable after
    -- that — a lost key is replaced, never recovered.
    -- ============================================================

    CREATE TYPE doe_api_key_origin_enum AS ENUM ('ISLAND_IS', 'ADMIN');

    CREATE TABLE doe_api_key (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

      company_id UUID NOT NULL REFERENCES company(id),

      -- Denormalised from company.national_id so the partner API can
      -- resolve the authenticated tenant from one indexed read on this
      -- table alone: it registers ApiKeyModel and nothing else, so a
      -- join would mean pulling in the whole model graph. Safe to copy
      -- because a kennitala IS the company's identity and never
      -- changes, so the two columns cannot drift apart.
      company_national_id TEXT NOT NULL,

      -- Public half of the credential, carried in the key itself. The
      -- lookup key on every authenticated request.
      key_id TEXT NOT NULL UNIQUE,
      secret_hash TEXT NOT NULL,

      label TEXT DEFAULT NULL,
      scopes TEXT[] NOT NULL,

      created_via doe_api_key_origin_enum NOT NULL,
      created_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      created_by_national_id TEXT DEFAULT NULL,

      expires_at TIMESTAMPTZ DEFAULT NULL,

      -- Activity indicator, not an exact timestamp: the partner API
      -- writes it at most once a minute per key so authentication does
      -- not turn into a write on every request.
      last_used_at TIMESTAMPTZ DEFAULT NULL,

      revoked_at TIMESTAMPTZ DEFAULT NULL,
      revoked_by_user_id UUID DEFAULT NULL REFERENCES doe_user(id),
      revoked_by_national_id TEXT DEFAULT NULL,
      revoked_reason TEXT DEFAULT NULL,

      -- The two issuance paths carry different kinds of actor and
      -- doe_user only covers one of them: an ADMIN key names the
      -- reviewer, an ISLAND_IS key names the person who minted it
      -- (user.actor.nationalId under delegation — there is no doe_user
      -- row for them). Tying the pair to created_via here is what stops
      -- a key existing with no attributable actor, which is the whole
      -- point of recording it.
      CONSTRAINT doe_api_key_created_actor_chk CHECK (
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

      -- Revocation metadata exists only on a revoked row, and never
      -- names two actors at once. Deliberately allows a revoked row to
      -- name NEITHER: a future system-initiated revocation (company
      -- deactivated, key expired out) has no human actor, and this
      -- constraint should not be what blocks it.
      CONSTRAINT doe_api_key_revoked_chk CHECK (
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
      ),

      -- A key that grants nothing is a configuration mistake, not a
      -- valid state — it would authenticate and then fail every scope
      -- check, which reads as a server bug from the outside.
      CONSTRAINT doe_api_key_scopes_not_empty_chk CHECK (
        cardinality(scopes) > 0
      )
    );

    -- The partner API's authentication path: resolve tenant by kennitala.
    CREATE INDEX doe_api_key_company_national_id_idx
      ON doe_api_key (company_national_id);

    -- The admin path: list the keys held by one company.
    CREATE INDEX doe_api_key_company_id_idx
      ON doe_api_key (company_id);

    COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP TABLE IF EXISTS doe_api_key;
    DROP TYPE IF EXISTS doe_api_key_origin_enum;

    COMMIT;
    `)
  },
}
