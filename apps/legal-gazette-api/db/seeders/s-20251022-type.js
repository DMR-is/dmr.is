'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        ADVERT_STATUS (ID, TITLE, SLUG)
      VALUES
        (
          '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
          'Í vinnslu',
          'i-vinnslu'
        );
      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DELETE FROM ADVERT_STATUS
      WHERE
        ID = '7ef679c4-4f66-4892-b6ad-ee05e0be4359';
    `)
  },
}
