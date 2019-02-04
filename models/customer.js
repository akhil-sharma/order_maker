const Promise = require('bluebird')

const db = require('./dbconnection').db
const util = require('../utils/utils')

var saveCustomerId = (customer) => {
    return new Promise((resolve, reject) => {
        let sql = `INSERT INTO stripe_user (userId, stripeId) values (${customer.metadata.userId}, "${customer.id}")`;

        db.query(sql, (error, results, fields) => {
            if(error){
                console.log("Error:", error);
                return reject(error);
            }
            resolve("success--save");            
        })
    })
}

var retrieveCustomerId = (user_id) => {
    return new Promise((resolve, reject) => {
        db.getConnection((error, connection) =>{
            if(error){
                return reject("Error: could not get a connection.");
            }

            let customerIdSQL = `SELECT stripeId FROM stripe_user WHERE userId = ${user_id}`
            connection.query(customerIdSQL, (error, results, fields) => {
                if (error){
                    console.log("Error:", error);
                    return reject("Error:", error);
                }

                if(util.isEmptyArray(results)){
                    resolve("empty");
                }else{
                    resolve(results[0].stripeId);
                }

            })
        })
    })
}

var saveCard = (charge) => {
    return new Promise((resolve, reject) => {
        let sql =  `UPDATE stripe_user SET card = ${charge.source.last4} WHERE stripeId = "${charge.customer}"`;
        db.query(sql, (error, results, fields) =>{
            if(error){
                console.log("Error--savecard:", error);
                reject("error");
            }
            resolve("success");
        })
    })
}

var retrieveCard = (customer_id) => {
    return new Promise((resolve, reject) => {
        let sql = `SELECT card FROM stripe_user WHERE stripeId = "${customer_id}"`;

        db.query(sql, (error, results, fields) =>{
            if(error){
                console.log("Error--retrievecard", error);
                return reject(error);
            }
            if(util.isEmptyArray(results)){
                console.log("No results found");
                return resolve("empty");
            }
            resolve(results[0].card);
        })
    })
}

module.exports = {
    saveCustomerId,
    retrieveCustomerId,
    saveCard,
    retrieveCard
}