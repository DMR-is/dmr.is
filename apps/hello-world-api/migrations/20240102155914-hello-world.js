'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

        CREATE TABLE hello_world (
          id UUID NOT NULL,
          hello VARCHAR NOT NULL,
          world VARCHAR NOT NULL,
          created TIMESTAMP WITH TIME ZONE DEFAULT now(),
          PRIMARY KEY (id)
        );

      COMMIT;
    `)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DROP TABLE hello_world;
    `)
  }
};
