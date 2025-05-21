'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const caseTypeSeed = await readFile(
      './src/modules/case-type/case-type.seed.sql',
      'utf8',
    )

    const caseCategoriesSeed = await readFile(
      './src/modules/case-category/case-category.seed.sql',
      'utf8',
    )

    const caseStatusSeed = await readFile(
      './src/modules/case-status/case-status.seed.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

        ${caseTypeSeed}
        ${caseCategoriesSeed}
        ${caseStatusSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

        DELETE FROM CASE_CATEGORY;

        DELETE FROM CASE_TYPE;

      COMMIT;
    `)
  },
}
