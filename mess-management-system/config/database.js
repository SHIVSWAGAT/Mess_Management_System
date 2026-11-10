const { databasePath } = require('../app/database/sqlite');

module.exports = function initialiseDatabase() {
    console.log(`SQLite database ready: ${databasePath}`);
};
