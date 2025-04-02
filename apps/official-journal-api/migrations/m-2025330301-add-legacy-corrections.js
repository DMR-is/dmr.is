'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

    -- Alter ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION ADD COLUMN IS_LEGACY BOOLEAN DEFAULT FALSE;
      ALTER TABLE ADVERT_CORRECTION ADD COLUMN LEGACY_DATE TIMESTAMP DEFAULT NULL;
      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- Revert changes to ADVERT_CORRECTION table
      ALTER TABLE ADVERT_CORRECTION DROP COLUMN IS_LEGACY;
      ALTER TABLE ADVERT_CORRECTION DROP COLUMN LEGACY_DATE;
      
      COMMIT;
    `)
  },
}
