const mysql = require('mysql');
const config = require('../config/config')

var pool = mysql.createPool(config.mysql_config);

module.exports = {
    db: pool
}