'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS BACKFILLED_PUBLICATION (
        ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        PUBLICATION_ID UUID NOT NULL REFERENCES ADVERT_PUBLICATION(ID),
        CREATED_AT TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UPDATED_AT TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        DELETED_AT TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS IDX_BACKFILLED_PUBLICATION_PUBLICATION_ID
        ON BACKFILLED_PUBLICATION (PUBLICATION_ID);

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS IDX_BACKFILLED_PUBLICATION_PUBLICATION_ID;
      DROP TABLE IF EXISTS BACKFILLED_PUBLICATION;

      COMMIT;
    `)
  },
}
