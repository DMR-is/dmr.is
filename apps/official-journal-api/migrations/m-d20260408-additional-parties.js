'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      CREATE TABLE IF NOT EXISTS ADDITIONAL_PARTIES (
        ID UUID NOT NULL DEFAULT UUID_GENERATE_V4(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        INVOLVED_PARTY_ID UUID NOT NULL REFERENCES ADVERT_INVOLVED_PARTY(ID),
        CASE_ID UUID REFERENCES CASE_CASE(ID) ON DELETE CASCADE,
        ADVERT_ID UUID REFERENCES ADVERT(ID) ON DELETE CASCADE,

        PRIMARY KEY (ID),
        CHECK (CASE_ID IS NOT NULL OR ADVERT_ID IS NOT NULL)
      );

      CREATE INDEX IF NOT EXISTS idx_additional_parties_involved_party_id ON ADDITIONAL_PARTIES (INVOLVED_PARTY_ID);
      CREATE INDEX IF NOT EXISTS idx_additional_parties_case_id ON ADDITIONAL_PARTIES (CASE_ID);
      CREATE INDEX IF NOT EXISTS idx_additional_parties_advert_id ON ADDITIONAL_PARTIES (ADVERT_ID);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_parties_case_party_unique
        ON ADDITIONAL_PARTIES (CASE_ID, INVOLVED_PARTY_ID)
        WHERE CASE_ID IS NOT NULL AND DELETED_AT IS NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_additional_parties_advert_party_unique
        ON ADDITIONAL_PARTIES (ADVERT_ID, INVOLVED_PARTY_ID)
        WHERE ADVERT_ID IS NOT NULL AND DELETED_AT IS NULL;

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      DROP INDEX IF EXISTS idx_additional_parties_involved_party_id;
      DROP INDEX IF EXISTS idx_additional_parties_case_id;
      DROP INDEX IF EXISTS idx_additional_parties_advert_id;
      DROP INDEX IF EXISTS idx_additional_parties_case_party_unique;
      DROP INDEX IF EXISTS idx_additional_parties_advert_party_unique;

      DROP TABLE IF EXISTS ADDITIONAL_PARTIES;

      COMMIT;
    `)
  },
}
