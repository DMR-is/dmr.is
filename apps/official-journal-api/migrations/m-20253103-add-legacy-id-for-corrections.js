'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION ADD COLUMN LEGACY_ID UUID;
      ALTER TABLE ADVERT_CORRECTION DROP CONSTRAINT FK_ADVERT_CORRECTION_ADVERT_ID;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN ADVERT_ID DROP NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN DOCUMENT_HTML DROP NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN TITLE DROP NOT NULL;
      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION DROP COLUMN LEGACY_ID;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN ADVERT_ID SET NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN DOCUMENT_HTML SET NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN TITLE SET NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ADD CONSTRAINT FK_ADVERT_CORRECTION_ADVERT_ID FOREIGN KEY (ADVERT_ID) REFERENCES ADVERT (ID) ON DELETE CASCADE;

      COMMIT;
    `)
  },
}
