'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE ADVERT_COMMENT_TYPE ADD VALUE IF NOT EXISTS 'DELETE_PUBLICATION';
      ALTER TYPE ADVERT_COMMENT_TYPE ADD VALUE IF NOT EXISTS 'CREATE_PUBLICATION';

      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`

      -- https://blog.yo1.dog/updating-enum-values-in-postgresql-the-safe-and-easy-way/

      BEGIN;

      DELETE FROM ADVERT_COMMENT WHERE TYPE IN ('DELETE_PUBLICATION', 'CREATE_PUBLICATION');

      ALTER TYPE ADVERT_COMMENT_TYPE RENAME TO ADVERT_COMMENT_TYPE_OLD;

      CREATE TYPE ADVERT_COMMENT_TYPE AS ENUM ('SUBMIT', 'ASSIGN', 'STATUS_UPDATE', 'COMMENT', 'PUBLISH');

      ALTER TABLE ADVERT_COMMENT ALTER COLUMN TYPE TYPE ADVERT_COMMENT_TYPE USING TYPE::text::ADVERT_COMMENT_TYPE;

      DROP TYPE ADVERT_COMMENT_TYPE_OLD;

      COMMIT;
    `)
  },
}
