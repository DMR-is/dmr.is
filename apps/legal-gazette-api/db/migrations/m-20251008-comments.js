'use strict'

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query(`
      BEGIN;

      -- internal comments table that tracks the life cycle of an advert

      -- when an advert is created (by who)
      -- when an advert is assigned to a user (by who)
      -- when an advert status is updated (from what to what, by who)
      -- when an advert is published

      CREATE TYPE ADVERT_COMMENT_TYPE AS ENUM ('SUBMIT', 'ASSIGN', 'STATUS_UPDATE', 'COMMENT');

      CREATE TABLE ADVERT_COMMENT (
        ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        DELETED_AT TIMESTAMP WITH TIME ZONE,

        TYPE ADVERT_COMMENT_TYPE NOT NULL,

        STATUS_ID UUID REFERENCES ADVERT_STATUS(ID) ON DELETE SET NULL,
        ADVERT_ID UUID NOT NULL REFERENCES ADVERT(ID) ON DELETE CASCADE,

        ACTOR_ID TEXT NOT NULL,
        RECEIVER_ID TEXT,
        COMMENT TEXT,
      );

      COMMIT;
    `)
  },

  down(queryInterface, Sequelize) {
    return queryInterface.sequelize.query(`
      BEGIN;

        DROP TABLE IF EXISTS ADVERT_COMMENT;
        DROP TYPE IF EXISTS ADVERT_COMMENT_TYPE;

      COMMIT;
    `)
  },
}
