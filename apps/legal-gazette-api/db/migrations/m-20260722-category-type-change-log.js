'use strict'

/**
 * Schema for admin-managed advert taxonomy.
 *
 *  - Adds `active` to advert_category + advert_type. Inactive rows are excluded
 *    from the create-flow dropdowns but stay valid for existing adverts and
 *    search facets. (Replaces the hardcoded UNASSIGNABLE_*_IDS constants.)
 *  - Adds `category_type_change_log`: an append-only log of every admin change to the
 *    taxonomy (create/update/delete/attach/detach/set-active/move/revert), with
 *    before/after JSONB snapshots, the blast radius (affected advert count), the
 *    exact affected advert ids (for precise undo of bulk moves), and a link from
 *    a revert back to the entry it undid.
 *
 * Data corrections (renames, join rebuild, Fyrirkall remap) are intentionally
 * NOT done here — admins perform those through the new management page.
 */

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_CATEGORY
        ADD COLUMN IF NOT EXISTS ACTIVE BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE ADVERT_TYPE
        ADD COLUMN IF NOT EXISTS ACTIVE BOOLEAN NOT NULL DEFAULT TRUE;

      CREATE TABLE IF NOT EXISTS CATEGORY_TYPE_CHANGE_LOG (
        ID                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        ACTOR_ID              VARCHAR(255) NOT NULL,
        ACTOR_NAME            VARCHAR(255),
        ACTION                VARCHAR(64)  NOT NULL,
        ENTITY_TYPE           VARCHAR(32)  NOT NULL,
        ENTITY_ID             UUID,
        BEFORE                JSONB,
        AFTER                 JSONB,
        AFFECTED_ADVERT_COUNT INTEGER      NOT NULL DEFAULT 0,
        AFFECTED_ADVERT_IDS   JSONB,
        REVERTS_AUDIT_ID      UUID         REFERENCES CATEGORY_TYPE_CHANGE_LOG (ID),
        CREATED_AT            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS CATEGORY_TYPE_CHANGE_LOG_ENTITY_IDX
        ON CATEGORY_TYPE_CHANGE_LOG (ENTITY_TYPE, ENTITY_ID);
      CREATE INDEX IF NOT EXISTS CATEGORY_TYPE_CHANGE_LOG_CREATED_AT_IDX
        ON CATEGORY_TYPE_CHANGE_LOG (CREATED_AT DESC);

      COMMIT;
    `)
  },

  async down(queryInterface) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP TABLE IF EXISTS CATEGORY_TYPE_CHANGE_LOG;

      ALTER TABLE ADVERT_CATEGORY DROP COLUMN IF EXISTS ACTIVE;
      ALTER TABLE ADVERT_TYPE DROP COLUMN IF EXISTS ACTIVE;

      COMMIT;
    `)
  },
}
