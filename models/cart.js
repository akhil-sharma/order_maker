const db = require('./dbconnection').db
const util = require('../utils/utils')

//add pending cart and retrieve the cart id.
var addPendingCart = (user_id) => {
    let pendingCartSQL = `INSERT INTO \`cart\` (userId) SELECT * FROM (SELECT ${user_id}) AS tmp WHERE NOT EXISTS (SELECT userId FROM \`cart\` WHERE userId = ${user_id} AND checkedOut = 'pending') LIMIT 1;`;

    let cartIdSQL = `SELECT cartId from \`cart\` where userId = ${user_id} and checkedOut = 'pending';`;

    return new Promise((resolve, reject) => {
        db.getConnection().then((connection) => {
            connection.query(pendingCartSQL)
            .then(response=> {
                return connection.query(cartIdSQL)
            }).then(response => {
                let cartId = response[0].cartId;
                resolve(cartId)
            }).catch(err => {
                if(err){
                    reject("Error:", err);
                }
            })
        }).catch(function(err) {
            reject("Error:", err);
        });    
    })
}

//add item and update cart value
var addItemToCart = (cart_id, product_id, quantity, price) => {
    let addToCartSQL = `INSERT INTO \`cart_item\` (cartId, productId, quantity, price, totalPrice) VALUES (${cart_id}, ${product_id}, ${quantity}, ${price}, ${quantity * price});`;

    let updateCartValueSQL = `UPDATE \`cart\` SET value = value + ${price * quantity} WHERE cartId = ${cart_id}`;

    return new Promise((resolve, reject) => {
        db.getConnection().then((connection) => {
            connection.query(addToCartSQL)
            .then(response => {
                return connection.query(updateCartValueSQL)
            })
            .then(response => {
                resolve("success")
            })
            .catch(err => {
                if (err){
                    reject("Error:", err)
                }
            })
        }).catch(err => {
            if(err){
                reject("Error:", err)
            }
        })
    });
}

//return the contents of the cart
var getUserCart = (user_id) => {
    let cartItemsSQL = `SELECT productId, quantity, price, totalPrice FROM \`cart_item\` WHERE cartId IN (SELECT cartId FROM \`cart\` WHERE userId = ${user_id});`;

    let cartValueSQL = `SELECT value FROM \`cart\` WHERE userId = ${user_id};`;

    return new Promise((resolve, reject) => {
        var items;
        db.getConnection().then((connection) => {
            connection.query(cartItemsSQL)
            .then(response => {
                items = response;
                return connection.query(cartValueSQL)
            }).then(response => {
                let cart_value = response[0].value;
                let cart_structure = util.formatOrder(items, cart_value)
                resolve(cart_structure);
            })
            .catch(err => {
                if (err){
                    reject("Error:", err)
                }
            })
        }).catch(err => {
            if(err){
                reject("Error:", err)
            }
        })
    });
}



module.exports = {
    addPendingCart,
    addItemToCart,
    getUserCart
}