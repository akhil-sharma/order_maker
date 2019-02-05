// const Promise = require('bluebird')

// const db = require('./dbconnection').db
// const util = require('../utils/utils')

// var saveCardId = (card) => {
//     return new Promise((resolve, reject) => {
//         let sql = `INSERT INTO stripe_cards (stripeId, cardId) values ("${card.id}","${card.customer}")`;

//         db.query(sql, (error, results, fields) => {
//             if(error){
//                 console.log("Error:", error);
//                 return reject(error);
//             }
//             return resolve("success");            
//         })
//     })
// }

// var retrieveCardId = (customer_id) => {
//     return new Promise((resolve, reject) => {
//         db.getConnection((error, connection) =>{
//             if(error){
//                 return reject("Error: could not get a connection.");
//             }

//             let customerIdSQL = `SELECT cardId FROM stripe_cards WHERE stripeId = "${customer_id}"`
//             connection.query(customerIdSQL, (error, results, fields) => {
//                 if (error){
//                     console.log("Error:", err);
//                     return reject("Error", err);
//                 }

//                 if(util.isEmptyArray(results)){
//                     return resolve("empty");
//                 }else{
//                     return resolve(results[0].cardId);
//                 }

//             })
//         })
//     })
// }

// module.exports = {
//     saveCardId,
//     retrieveCardId
// }