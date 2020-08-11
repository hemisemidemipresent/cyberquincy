'use strict'
// this is the file used to make changes to the database (it's called migrations or something), for example adding/deleting a new field. for configuration options see ./config
// you run npx sequelize-cli db:migrate to set changes. Do remember to install sequelize-cli using npm sequelize-cli first
// its best not to touch this file unless necessary
module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        return Promise.all([
            queryInterface.addColumn(
                'Tags', // table name
                'quiz', // new field name
                {
                    type: Sequelize.INTEGER,
                    allowNull: true
                }
            )
        ])
    },

    down: async (queryInterface, Sequelize) => {
        // logic for reverting the changes, aka if there happnes to be a fuckup somewhere along the way

        return Promise.all([queryInterface.removeColumn('Tags', 'quiz')])
    }
}
