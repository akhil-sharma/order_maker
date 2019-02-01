const db = require('./dbconnection').db
const util = require('../utils/utils')

var productList = () => {
    let sql = `SELECT productId, name, price, description FROM product_list;`;  
    return new Promise((resolve, reject)=>{
        db.query(sql)
        .then(response => {
            resolve (response);
        }).catch(err => {
            if(err){
                reject("Error:", err)
            }
        });        
    })
}

var getItemPrice = (product_id) => {
    let sql = `SELECT price FROM \`product_list\` WHERE productId = ${product_id};`;
    return new Promise((resolve, reject) => {
        db.query(sql)
        .then(response => {
            let item_price = response[0].price;
            resolve(item_price);
        })
        .catch(err => {
            if(err){
                reject("ERROR:", err);
            }
        })
    })
}



module.exports = {
    productList,
    getItemPrice
};
