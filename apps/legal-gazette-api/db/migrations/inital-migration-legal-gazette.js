'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE CASE_TYPE (
      ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      DELETED_AT TIMESTAMPTZ,

      TITLE TEXT NOT NULL,
      SLUG TEXT NOT NULL UNIQUE
    );

    CREATE TABLE CASE_CATEGORY (
      ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      DELETED_AT TIMESTAMPTZ,

      TITLE TEXT NOT NULL,
      SLUG TEXT NOT NULL UNIQUE,

      CASE_TYPE_ID UUID NOT NULL REFERENCES CASE_TYPE(ID) ON DELETE CASCADE
    );

    CREATE TABLE CASE_STATUS (
      ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      DELETED_AT TIMESTAMPTZ,

      TITLE TEXT NOT NULL,
      SLUG TEXT NOT NULL UNIQUE
    );

    CREATE INDEX idx_case_type_title_asc ON CASE_TYPE (TITLE ASC);
    CREATE INDEX idx_case_category_title_asc ON CASE_CATEGORY (TITLE ASC);
    CREATE INDEX idx_case_status_title_asc ON CASE_STATUS (TITLE ASC);

    CREATE TABLE CASES (
      ID UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      CREATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UPDATED_AT TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      DELETED_AT TIMESTAMPTZ,

      TITLE TEXT NOT NULL,
      SLUG TEXT NOT NULL UNIQUE,

      CASE_TYPE_ID UUID NOT NULL REFERENCES CASE_TYPE(ID) ON DELETE CASCADE,
      CASE_CATEGORY_ID UUID NOT NULL REFERENCES CASE_CATEGORY(ID) ON DELETE CASCADE,
      CASE_STATUS_ID UUID NOT NULL REFERENCES CASE_STATUS(ID) ON DELETE CASCADE
    );


    COMMIT;

    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;

    DROP INDEX idx_case_category_title_asc;
    DROP INDEX idx_case_type_title_asc;
    DROP INDEX idx_case_status_title_asc;

    DROP TABLE CASE_CATEGORY;
    DROP TABLE CASE_TYPE;
    DROP TABLE CASE_STATUS;

    COMMIT;

    `)
  },
}
