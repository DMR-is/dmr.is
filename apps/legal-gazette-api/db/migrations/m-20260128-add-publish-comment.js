'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      ALTER TYPE ADVERT_COMMENT_TYPE ADD VALUE IF NOT EXISTS 'PUBLISH';


      COMMIT;
    `)
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`

      -- https://blog.yo1.dog/updating-enum-values-in-postgresql-the-safe-and-easy-way/

      -- We delete all the publish comments, we could also mark them as something else if we wanted to keep them
      -- but for now we just delete them

      BEGIN;

      DELETE FROM ADVERT_COMMENT WHERE TYPE = 'PUBLISH';

      ALTER TYPE ADVERT_COMMENT_TYPE RENAME TO ADVERT_COMMENT_TYPE_OLD;

      CREATE TYPE ADVERT_COMMENT_TYPE AS ENUM ('SUBMIT', 'ASSIGN', 'STATUS_UPDATE', 'COMMENT');

      ALTER TABLE ADVERT_COMMENT ALTER COLUMN TYPE TYPE ADVERT_COMMENT_TYPE USING TYPE::text::ADVERT_COMMENT_TYPE;

      DROP TYPE ADVERT_COMMENT_TYPE_OLD;

      COMMIT;
    `)
  },
}
