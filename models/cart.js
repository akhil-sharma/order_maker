const Promise = require('bluebird')

const db      = require('./dbconnection').db
const util    = require('../utils/utils')

var getUserCart = (user_id) => {
    return new Promise((resolve, reject) => {
        let cartValueSQL = `SELECT cartId, value FROM \`cart\` WHERE userId = ? AND checkedOut = 'pending'`;
        let cartItemsSQL =  `SELECT productId, quantity, price, totalPrice FROM \`cart_item\` WHERE cartId = ?`;

        db.getConnection((err, connection) => {
            if (err){
                return reject("Error--cart-1:", err);
            }

            connection.query(cartValueSQL, user_id,(error, results, fields) => {
                if(error){
                    reject("Error--cart-5: cart doesn't exist.");
                    console.log(error)
                    connection.release();
                    return;
                }

                if(util.isEmptyArray(results)){
                    reject("Error--cart-4: cart does not exist");
                    connection.release();
                    return;
                }
                //console.log(results);
                var cart_value = results[0].value;
                var cartId     = results[0].cartId;

                connection.query(cartItemsSQL, cartId,(error, results, fields) => {
                    if(error){
                        reject("Error--cart-3:", error);
                        connection.release();
                        return;
                    }
                    
                    if(util.isEmptyArray(results)){
                            reject("Error--cart-2: no items found");
                            connection.release();
                            return;
                    }

                    var cart_structure = util.formatOrder(results, cart_value, cartId);
                    connection.release();
                    resolve(cart_structure);
                })

            })
        })
    })
}

var addItemToCart = (user_id, product_id, price, quantity) => {
    return new Promise((resolve, reject) => {
        let pendingCartSQL = `INSERT INTO \`cart\` (userId) SELECT * FROM (SELECT ? ) AS tmp WHERE NOT EXISTS (SELECT userId FROM \`cart\` WHERE userId = ? AND checkedOut = 'pending') AND EXISTS (SELECT * FROM \`user_info\` WHERE id = ?) LIMIT 1`; //IF the user exists
        let cartIdSQL = `SELECT cartId from \`cart\` where userId = ? and checkedOut = 'pending'`;

        db.getConnection((err, connection) => {
            if (err){
                return reject("Error--cart:", err);
            }
            connection.beginTransaction((err) => {
                if(err){
                   connection.release();
                   return;
                } 
                connection.query(pendingCartSQL, [user_id, user_id, user_id],(error, results, fields) =>{//add cart
                    if (error){
                        return connection.rollback(() => {
                            console.log(error);
                            reject("Error--cart:", error);
                            connection.release();
                        })
                    }
                    connection.query(cartIdSQL, user_id,(error, results, fields) => {//cart id
                        if(error){
                            return connection.rollback(() => {
                                console.log(error);
                                reject("Error--cart:", error);
                                connection.release();
                            })
                        }

                        if(util.isEmptyArray(results)){
                            return connection.rollback(() => {
                                reject("Error--cart: user not found");
                                connection.release();
                            });
                        }

                        var cart_id = results[0].cartId;
                        let addToCartSQL = "INSERT INTO `cart_item` (cartId, productId, quantity, price, totalPrice) VALUES ( ? ,? ,? ,? ,?)";
                        connection.query(addToCartSQL, [cart_id, product_id, quantity, price, quantity*price],(error, results, fields) => { //add to cart
                            if(error){
                                console.log(error);
                                return connection.rollback(() => {
                                   reject("Error--cart:", error);
                                   connection.release();
                                });
                            }

                            let updateCartValueSQL = `UPDATE \`cart\` SET value = \`value\` + ? WHERE cartId = ?`;
                            connection.query(updateCartValueSQL, [price * quantity, cart_id], (error, results, fields) => { //update the total cart value
                                if(error){
                                    console.log(error);
                                    return connection.rollback(() => {
                                       reject("Error--cart:", error);
                                       connection.release();
                                    });
                                }
                                connection.commit((err) => {
                                    if(err){
                                        return connection.rollback(() => {
                                            reject("Error--cart: could not commit changes");
                                            connection.release();
                                        })
                                    }
                                    connection.release();
                                    resolve("success");
                                    return;
                                })
                            })
                        })
                    })
                })
            })
        })
    })

}

var updateCartStatus = (cartId) => {
    return new Promise((resolve, reject) => {
        let sql = `UPDATE cart SET checkedOut="complete" WHERE cartId = ${cartId}`;
        db.query(sql, (error, results, fields) => {
            if(error){
                console.log(error);
                reject("Error--cart: ", error);
            }
            resolve("success");
        })
    })
}


module.exports = {
    addItemToCart,
    getUserCart,
    updateCartStatus
}
