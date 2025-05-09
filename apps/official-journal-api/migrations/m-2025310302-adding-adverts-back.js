'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN ADVERT_ID SET NOT NULL;
      ALTER TABLE ADVERT_CORRECTION ADD CONSTRAINT FK_ADVERT_CORRECTION_ADVERT_ID FOREIGN KEY (ADVERT_ID) REFERENCES ADVERT (ID) ON DELETE CASCADE;
      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION DROP CONSTRAINT FK_ADVERT_CORRECTION_ADVERT_ID;
      ALTER TABLE ADVERT_CORRECTION ALTER COLUMN ADVERT_ID DROP NOT NULL;


      COMMIT;
    `)
  },
}
