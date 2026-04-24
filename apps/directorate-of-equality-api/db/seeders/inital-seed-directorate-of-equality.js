'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const seed = `
      BEGIN;

      INSERT INTO
        DOE_USER (
          ID,
          NATIONAL_ID,
          FIRST_NAME,
          LAST_NAME,
          EMAIL,
          PHONE,
          IS_ACTIVE
        )
      VALUES
        (
          'b4e98cee-a4d8-4924-90df-b820c4bc0801',
          '0101302399',
          'Gervimaður',
          'Færeyjar',
          'gm@faereyjar.is',
          '555-1234',
          TRUE
        );

      INSERT INTO
        CONFIG (
          ID,
          KEY,
          VALUE,
          DESCRIPTION
        )
      VALUES
        (
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'salary_difference_threshold_percent',
          '3.9',
          'Annual gender salary difference threshold (%). Updated each February.'
        );

COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

      COMMIT;
    `)
  },
}
