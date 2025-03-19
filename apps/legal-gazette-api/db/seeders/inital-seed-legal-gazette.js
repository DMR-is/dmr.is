'use strict'

const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const seed = `
      BEGIN;


      INSERT INTO TEST_TABLE (
        id,
        name,
        created_at,
        updated_at
      ) VALUES (
        'b0d5c0e2-0d3c-4b7c-8a3f-7c0b2e7b3c4d',
        'Test Name',
        '2021-10-01 00:00:00',
        '2021-10-01 00:00:00'
      );

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;
       DROP TABLE IF EXISTS TEST_TABLE;
      COMMIT;
    `)
  },
}
