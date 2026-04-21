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
