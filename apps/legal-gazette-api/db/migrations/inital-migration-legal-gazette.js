'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE BASE_TABLE (
      ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      DELETED_AT TIMESTAMP WITH TIME ZONE
    );

    CREATE TABLE BASE_ENTITY_TABLE (
      TITLE TEXT NOT NULL,
      SLUG TEXT NOT NULL,
      CONSTRAINT BASE_ENTITY_TABLE_SLUG_UNIQUE UNIQUE (SLUG)
    ) INHERITS (BASE_TABLE);

    CREATE TABLE CASE_TYPE () INHERITS (BASE_ENTITY_TABLE);

    CREATE UNIQUE INDEX CASE_TYPE_SLUG_UNIQUE ON CASE_TYPE (SLUG);

    COMMIT;

    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP INDEX CASE_TYPE_SLUG_UNIQUE;

    DROP TABLE CASE_TYPE;

    DROP TABLE BASE_ENTITY_TABLE;

    DROP TABLE BASE_TABLE;

    COMMIT;

    `)
  },
}
