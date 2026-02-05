'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        application_attachment_type(id, title, slug)
      VALUES
        (
          '2d60e8b3-b75a-45ae-bfed-817fe8e25fc2',
          'Meginmál',
          'meginmal'
        );
      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DELETE FROM
        application_attachment_type
      WHERE
        id = '2d60e8b3-b75a-45ae-bfed-817fe8e25fc2';
    `)
  },
}
