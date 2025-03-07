'use strict'

const { readFile } = require('fs/promises')
const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // eslint-disable-next-line no-console
    console.log(cwd())
    const allUserSeed = await readFile('./seeders/sql/all_user.sql', 'utf8')
    const allAdvertSeed = await readFile('./seeders/sql/all_advert.sql', 'utf8')
    const allCaseSeed = await readFile('./seeders/sql/all_case.sql', 'utf8')
    const feeCodesSeed = await readFile('./seeders/sql/fee_codes.sql', 'utf8')

    const seed = `
      BEGIN;

      ${allAdvertSeed}
      ${allCaseSeed}
      ${allUserSeed}
      ${feeCodesSeed}

      COMMIT;
      `

    return await queryInterface.sequelize.query(seed)
  },

  async down(queryInterface) {
    return await queryInterface.sequelize.query(`
      BEGIN;
        -- RELATIONAL TABLES
        DROP TABLE IF EXISTS advert_categories;
        DROP TABLE IF EXISTS advert_attachments;
        DROP TABLE IF EXISTS case_categories;
        DROP TABLE IF EXISTS case_channels;
        DROP TABLE IF EXISTS case_comments;
        DROP TABLE IF EXISTS signature_members;
        DROP TABLE IF EXISTS case_signatures;
        DROP TABLE IF EXISTS advert_signatures;
        DROP TABLE IF EXISTS case_attachments;
        DROP TABLE IF EXISTS application_attachments;
        DROP TABLE IF EXISTS application_user_involved_parties;
        DROP TABLE IF EXISTS admin_user_roles;

        -- TABLES WITH FOREIGN KEYS
        DROP TABLE IF EXISTS category_department;
        DROP TABLE IF EXISTS application_attachment;
        DROP TABLE IF EXISTS case_comment;
        DROP TABLE IF EXISTS advert;
        DROP TABLE IF EXISTS advert_category;
        DROP TABLE IF EXISTS case_case;
        DROP TABLE IF EXISTS signature;
        DROP TABLE IF EXISTS signature_member;
        DROP TABLE IF EXISTS advert_type;

        -- REGULAR TABLES
        DROP TABLE IF EXISTS application_attachment_type;
        DROP TABLE IF EXISTS signature_type;
        DROP TABLE IF EXISTS advert_status;
        DROP TABLE IF EXISTS advert_department;
        DROP TABLE IF EXISTS advert_main_category;
        DROP TABLE IF EXISTS case_tag;
        DROP TABLE IF EXISTS case_status;
        DROP TABLE IF EXISTS case_channel;
        DROP TABLE IF EXISTS case_comment_type;
        DROP TABLE IF EXISTS case_communication_status;
        DROP TABLE IF EXISTS application_user;
        DROP TABLE IF EXISTS admin_user;
        DROP TABLE IF EXISTS user_role;
        DROP TABLE IF EXISTS advert_involved_party;
        DROP TABLE IF EXISTS application_fee_codes;
      COMMIT;
    `)
  },
}
