'use strict'

const seeds = `[
  {
    "id": "a1fd62db-18a6-4741-88eb-a7b7a7e05833",
    "hello": "Halló",
    "world": "Heimur"
  }
]`

module.exports = {
  up: (queryInterface, Sequelize) => {
    var model = queryInterface.sequelize.define('hello_world', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      hello: Sequelize.STRING,
      world: Sequelize.STRING,
    })

    return queryInterface.sequelize.transaction((t) =>
      Promise.all(
        JSON.parse(seeds).map((seed) =>
          queryInterface.upsert(
            'hello_world',
            {
              ...seed,
              created: new Date(),
            },
            {
              ...seed,
            },
            { id: seed.id },
            { transaction: t, model },
          ),
        ),
      ),
    )
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction((t) =>
      queryInterface.bulkDelete('hello_world', null, { transaction: t }),
    )
  },
}