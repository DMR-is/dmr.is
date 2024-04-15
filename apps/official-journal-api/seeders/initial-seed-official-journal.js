'use strict'

const { readFile } = require('fs/promises')
const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    console.log(cwd())
    const departmentsSeed = await readFile(
      '../official-journal-api-export/sql/00_departments.sql',
      'utf8',
    )
    const typesSeed = await readFile(
      '../official-journal-api-export/sql/01_types.sql',
      'utf8',
    )
    const categoriesSeed = await readFile(
      '../official-journal-api-export/sql/02_categories.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

      ${departmentsSeed}
      ${typesSeed}
      ${categoriesSeed}

      COMMIT;`
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

        DELETE FROM advert_department;
        DELETE FROM advert_type;
        DELETE FROM advert_category;

      COMMIT;
    `)
  },
}
