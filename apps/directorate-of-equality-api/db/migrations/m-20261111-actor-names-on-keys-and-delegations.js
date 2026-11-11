'use strict'

/**
 * Adds the name of the person who created a key or granted a delegation,
 * beside the kennitala already recorded for them:
 *
 * - `doe_api_key.created_by_name`
 * - `doe_partner_client_key.created_by_name`
 * - `doe_partner_delegation.granted_by_name`
 *
 * My Pages on island.is lists who created a key ("Búinn til af") and who
 * granted a service provider access ("Veitt af"). With only
 * `*_by_national_id` on the row it could show nothing but a raw kennitala,
 * which is PII on a shared screen. The name is snapshotted from the island.is
 * login token when the row is written (`resolveActorName`: the procuration
 * actor's name, or the subject's on a self-login), paired with the kennitala
 * from the same branch. No national-registry lookup.
 *
 * Nullable, and existing rows stay null: the name was never recorded, and a
 * registry lookup today would pass a guess off as what the person was called
 * when they acted. Null therefore means "recorded before names were stored"
 * (or, on keys, the admin path, which names the reviewer by
 * `created_by_user_id` instead), and a reader shows a fallback.
 *
 * No CHECK ties a name to its kennitala: the name is display data, and a token
 * with no name must not make an insert fail.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE doe_api_key
        ADD COLUMN created_by_name TEXT DEFAULT NULL;

      ALTER TABLE doe_partner_client_key
        ADD COLUMN created_by_name TEXT DEFAULT NULL;

      ALTER TABLE doe_partner_delegation
        ADD COLUMN granted_by_name TEXT DEFAULT NULL;

      COMMENT ON COLUMN doe_api_key.created_by_name IS 'Name of the person in created_by_national_id, snapshotted from the island.is token at issuance. Null on the ADMIN path and on rows issued before names were stored.';
      COMMENT ON COLUMN doe_partner_client_key.created_by_name IS 'Name of the person in created_by_national_id, snapshotted from the island.is token at issuance. Null on the ADMIN path and on rows issued before names were stored.';
      COMMENT ON COLUMN doe_partner_delegation.granted_by_name IS 'Name of the person in granted_by_national_id, snapshotted from the island.is token at grant. Null on rows granted before names were stored.';

      COMMIT;
    `)
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE doe_partner_delegation
        DROP COLUMN granted_by_name;

      ALTER TABLE doe_partner_client_key
        DROP COLUMN created_by_name;

      ALTER TABLE doe_api_key
        DROP COLUMN created_by_name;

      COMMIT;
    `)
  },
}
