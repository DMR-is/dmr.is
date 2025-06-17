'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        application_attachment_type(id, title, slug)
      VALUES
        (
          '2c82aeba-8a20-4bdc-94ba-9add3d6cfaa2',
          'Fylgigögn',
          'fylgigogn'
        );
      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DELETE FROM
        application_attachment_type
      WHERE
        id = '2c82aeba-8a20-4bdc-94ba-9add3d6cfaa2';
    `)
  },
}
