'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('advert', 'document_pdf_legacy', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('advert', 'document_pdf_legacy')
  },
}
