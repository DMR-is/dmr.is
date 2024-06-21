'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE users (
      id UUID NOT NULL DEFAULT uuid_generate_v4(),
      first_name VARCHAR NOT NULL,
      last_name VARCHAR NOT NULL,
      PRIMARY KEY (id)
    );

  COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
    BEGIN;
      DROP TABLE users;
    COMMIT;
    `)
  },
}
