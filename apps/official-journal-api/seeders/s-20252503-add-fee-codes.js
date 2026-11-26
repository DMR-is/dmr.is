'use strict'

const { readFile } = require('fs/promises')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
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
