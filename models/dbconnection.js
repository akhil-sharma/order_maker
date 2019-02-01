const mysql  = require('promise-mysql');
const config = require('../config/config');

const pool = mysql.createPool(config.mysql_config);

module.exports = {
    db: pool
}