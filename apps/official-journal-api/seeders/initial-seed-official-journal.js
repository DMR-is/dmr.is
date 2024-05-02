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

      COMMIT;
    `)
  },
}
