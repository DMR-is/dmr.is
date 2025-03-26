'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const caseTypeSeed = await readFile(
      '../../libs/legal-gazette/modules/case-type/src/seed/case-type.seed.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

        ${caseTypeSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;
        DELETE FROM CASE_TYPE;

        DELETE FROM BASE_ENTITY_TABLE;

        DELETE FROM BASE_TABLE;
      COMMIT;
    `)
  },
}
