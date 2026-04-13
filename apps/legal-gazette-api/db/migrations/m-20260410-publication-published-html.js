'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_PUBLICATION
      ADD COLUMN IF NOT EXISTS PUBLISHED_HTML TEXT;

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TABLE ADVERT_PUBLICATION
      DROP COLUMN IF EXISTS PUBLISHED_HTML;

      COMMIT;
    `)
  },
}
