'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const seed = `
      INSERT INTO
        DOCUMENT_ISSUE_SETTINGS (ID, DISTRICT_COMMISSIONER)
      VALUES
        (
          'd6882fb2-5824-4788-842f-da75b7e6c56a',
          'Kristín Þórðardóttir'
        );
      `
    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      DELETE FROM DOCUMENT_ISSUE_SETTINGS
      WHERE
        ID = 'd6882fb2-5824-4788-842f-da75b7e6c56a';
    `)
  },
}
