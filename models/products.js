const Promise = require('bluebird');

const db = require('./dbconnection').db;
const util = require('../utils/utils');

var productList = () => {
    let sql = `SELECT productId, name, price, description FROM product_list;`;
    return new Promise((resolve, reject) => {
        db.query(sql, (err, results, fields) => {
            if(err){
                reject("Error:", err);
            }else{
                resolve(results);
            }
        })
    })
}

var getItemPrice = (product_id) => {
    let sql  = `SELECT price, productId FROM product_list WHERE productId=${product_id}`;
    return new Promise((resolve, reject) => {
        db.query(sql, (error, results, fields) => {
            if(error){
                return reject("Error:", error);
            }
            if(util.isEmptyArray(results)){
                return reject("Error: item not available.")
            }
            return resolve(results[0].price);
        })
    })
}


module.exports = {
    productList,
    getItemPrice,
};
