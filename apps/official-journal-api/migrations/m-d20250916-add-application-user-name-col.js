'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('comment_v2', 'application_user_name', {
      type: Sequelize.TEXT,
      allowNull: true,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('comment_v2', 'application_user_name')
  },
}
