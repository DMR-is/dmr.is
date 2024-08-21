'use strict'

const { readFile } = require('fs/promises')
const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())
    const allSeed = await readFile('./seeders/sql/all.sql', 'utf8')
    const allCaseSeed = await readFile('./seeders/sql/all_case.sql', 'utf8')

    const seed = `
      BEGIN;

      ${allSeed}

      COMMIT;

      BEGIN;

      ${allCaseSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;
        DELETE FROM advert_categories;
        DELETE FROM category_department;
        DELETE FROM advert;
        DELETE FROM advert_type;
        DELETE FROM advert_department;
        DELETE FROM advert_category;
        DELETE FROM advert_main_category;
        DELETE FROM advert_status;
        DELETE FROM advert_involved_party;
        DELETE FROM case_status;
        DELETE FROM case_tag;
        DELETE FROM case_communication_status;
        DELETE FROM case_comment_title;
        DELETE FROM case_comment_type;
        DELETE FROM case_comment_task;
        DELETE FROM case_comment;
        DELETE FROM case_comments;
        DELETE FROM case_channel;
        DELETE FROM case_channels;
        DELETE FROM case_case;
        DELETE FROM signature_type;
        DELETE FROM signature_member;
        DELETE FROM signature;
        DELETE FROM signature_members;
        DELETE FROM case_signatures;
        DELETE FROM advert_signatures;
      COMMIT;
    `)
  },
}
