'use strict'

const { cwd } = require('process')
const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())

    const advertTypeSeed = await readFile(
      './src/modules/advert-type/advert-type.seed.sql',
      'utf8',
    )

    const advertCategoriesSeed = await readFile(
      './src/modules/advert-category/advert-category.seed.sql',
      'utf8',
    )

    const advertStatusSeed = await readFile(
      './src/modules/advert-status/advert-status.seed.sql',
      'utf8',
    )

    const usersSeed = await readFile(
      './src/modules/users/users.seed.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

        ${advertTypeSeed}
        ${advertCategoriesSeed}
        ${advertStatusSeed}
        ${usersSeed}

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
