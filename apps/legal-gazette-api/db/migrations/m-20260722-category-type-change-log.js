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
 *    a revert back to the entry it undid. A partial unique index on
 *    `reverts_audit_id` makes "one revert per entry" a database invariant, so two
 *    concurrent reverts of the same entry cannot both apply.
 *
 * Data correction performed here: the seven rows previously hardcoded in
 * `UNASSIGNABLE_CATEGORY_IDS` / `UNASSIGNABLE_TYPE_IDS` are set to ACTIVE = FALSE.
 * Those constants are removed in the same change, and `active` now drives the
 * create-flow dropdowns — without this step the rows would immediately become
 * selectable again in the public citizen application form. Reversed in `down`.
 *
 * The remaining data corrections (renames, join rebuild, Fyrirkall remap) are
 * intentionally NOT done here — admins perform those through the new management
 * page.
 */

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_CATEGORY
        ADD COLUMN IF NOT EXISTS ACTIVE BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE ADVERT_TYPE
        ADD COLUMN IF NOT EXISTS ACTIVE BOOLEAN NOT NULL DEFAULT TRUE;

      -- Carry over the previously hardcoded UNASSIGNABLE_* ids as ACTIVE = FALSE.
      -- ID is UUID typed; the literals are cast explicitly. UUID comparison is by
      -- value, so the mixed casing of these literals does not matter.
      UPDATE ADVERT_CATEGORY SET ACTIVE = FALSE WHERE ID IN (
        '52112993-EDCE-46A1-B7E6-8E3E5CD296F6'::uuid, -- Allar auglýsingar
        'b2b798e2-e8a3-4928-94eb-0021a5f13409'::uuid  -- Greiðsluaðlögun
      );
      UPDATE ADVERT_TYPE SET ACTIVE = FALSE WHERE ID IN (
        '82425CC8-B32E-4ADE-9EE4-BC6F8261B735'::uuid, -- Almennar auglýsingar
        '0A066E81-31AD-4F80-94D2-CE81F68F5368'::uuid, -- Handbækur
        'aa408eae-a76a-4ed8-9aa3-388dc0c8ff05'::uuid, -- Tölublöð
        'EC153CBB-BB48-4984-9F96-5E26CC522DD3'::uuid, -- Umferðarauglýsingar
        'CE0490FA-9CC0-48B4-AD47-5964D081DCDF'::uuid  -- Greiðsluáskorun
      );

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

      -- An entry can be reverted at most once. The service also checks this in
      -- application code for a friendly error, but that read is not serialisable
      -- under READ COMMITTED — this index is what actually closes the race.
      CREATE UNIQUE INDEX IF NOT EXISTS CATEGORY_TYPE_CHANGE_LOG_REVERTS_AUDIT_ID_UNIQUE_IDX
        ON CATEGORY_TYPE_CHANGE_LOG (REVERTS_AUDIT_ID)
        WHERE REVERTS_AUDIT_ID IS NOT NULL;

      COMMIT;
    `)
  },

  async down(queryInterface) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS CATEGORY_TYPE_CHANGE_LOG_REVERTS_AUDIT_ID_UNIQUE_IDX;
      DROP TABLE IF EXISTS CATEGORY_TYPE_CHANGE_LOG;

      -- Undo the deactivation before the column disappears, so a re-run of \`up\`
      -- starts from the same state it did the first time.
      UPDATE ADVERT_CATEGORY SET ACTIVE = TRUE WHERE ID IN (
        '52112993-EDCE-46A1-B7E6-8E3E5CD296F6'::uuid, -- Allar auglýsingar
        'b2b798e2-e8a3-4928-94eb-0021a5f13409'::uuid  -- Greiðsluaðlögun
      );
      UPDATE ADVERT_TYPE SET ACTIVE = TRUE WHERE ID IN (
        '82425CC8-B32E-4ADE-9EE4-BC6F8261B735'::uuid, -- Almennar auglýsingar
        '0A066E81-31AD-4F80-94D2-CE81F68F5368'::uuid, -- Handbækur
        'aa408eae-a76a-4ed8-9aa3-388dc0c8ff05'::uuid, -- Tölublöð
        'EC153CBB-BB48-4984-9F96-5E26CC522DD3'::uuid, -- Umferðarauglýsingar
        'CE0490FA-9CC0-48B4-AD47-5964D081DCDF'::uuid  -- Greiðsluáskorun
      );

      ALTER TABLE ADVERT_CATEGORY DROP COLUMN IF EXISTS ACTIVE;
      ALTER TABLE ADVERT_TYPE DROP COLUMN IF EXISTS ACTIVE;

      COMMIT;
    `)
  },
}
