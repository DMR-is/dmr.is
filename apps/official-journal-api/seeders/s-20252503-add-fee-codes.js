'use strict'

const { readFile } = require('fs/promises')
const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())
    const feeCodesSeed = await readFile('./seeders/sql/fee_codes.sql', 'utf8')

    const seed = `
      BEGIN;

      ${feeCodesSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;
        DROP TABLE IF EXISTS application_fee_codes;
      COMMIT;
    `)
  },
}
