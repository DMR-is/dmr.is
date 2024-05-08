'use strict'

const { readFile } = require('fs/promises')
const { cwd } = require('process')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    console.log(cwd())
    const departmentsSeed = await readFile(
      './seeders/sql/00_departments.sql',
      'utf8',
    )
    const typesSeed = await readFile('./seeders/sql/01_types.sql', 'utf8')
    const categoriesSeed = await readFile(
      './seeders/sql/02_categories.sql',
      'utf8',
    )
    const mainCategoriesSeed = await readFile(
      './seeders/sql/03_main_categories.sql',
      'utf8',
    )
    const advertStatusSeed = await readFile(
      './seeders/sql/04_advert_statuses.sql',
      'utf8',
    )
    const advertsSeed = await readFile('./seeders/sql/06_adverts.sql', 'utf8')
    const advertCategoriesSeed = await readFile(
      './seeders/sql/09_advert_categories.sql',
      'utf8',
    )
    const categoryDepartmentSeed = await readFile(
      './seeders/sql/07_category_department.sql',
      'utf8',
    )
    const caseStatusSeed = await readFile(
      './seeders/sql/10_case_status.sql',
      'utf8',
    )
    const caseTagSeed = await readFile('./seeders/sql/11_case_tag.sql', 'utf8')
    const caseCommunicationSeed = await readFile(
      './seeders/sql/12_case_communication_status.sql',
      'utf8',
    )
    const caseCommentTitleSeed = await readFile(
      './seeders/sql/13_case_comment_title.sql',
      'utf8',
    )
    const caseCommentTypeSeed = await readFile(
      './seeders/sql/14_case_comment_type.sql',
      'utf8',
    )

    const caseCommentTaskSeed = await readFile(
      './seeders/sql/15_case_comment_task.sql',
      'utf8',
    )

    const seed = `
      BEGIN;

      ${departmentsSeed}
      ${typesSeed}
      ${mainCategoriesSeed}
      ${categoriesSeed}
      ${advertStatusSeed}
      ${advertsSeed}
      ${categoryDepartmentSeed}
      ${advertCategoriesSeed}
      ${caseStatusSeed}
      ${caseTagSeed}
      ${caseCommunicationSeed}
      ${caseCommentTitleSeed}
      ${caseCommentTypeSeed}
      ${caseCommentTaskSeed}

      COMMIT;`
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
        DELETE FROM case_status;
        DELETE FROM case_tag;
        DELETE FROM case_communication_status;
        DELETE FROM case_comment_title;
        DELETE FROM case_comment_type;
        DELETE FROM case_comment_task;
      COMMIT;
    `)
  },
}
