'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const typeSeed = await readFile('./src/modules/type/type.seed.sql', 'utf8')

    const categoriesSeed = await readFile(
      './src/modules/category/category.seed.sql',
      'utf8',
    )

    const statusSeed = await readFile(
      './src/modules/status/status.seed.sql',
      'utf8',
    )

    const usersSeed = await readFile(
      './src/modules/users/users.seed.sql',
      'utf8',
    )
    const courtDistrictSeed = await readFile(
      './src/modules/court-district/court-district.seed.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

        ${typeSeed}
        ${categoriesSeed}
        ${statusSeed}
        ${usersSeed}
        ${courtDistrictSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;

      DELETE FROM AdvertStatus;

      DELETE FROM AdvertCategory;

      DELETE FROM AdvertType;

      COMMIT;
    `)
  },
}
