//stripes
const api_keys   = require('./api_keys') 
const keyPublishable = api_keys.keyPublishable;
const keySecret = api_keys.keySecret;

const stripe = require("stripe")(keySecret);

const express = require('express');
const hbs     = require('hbs');
const fs      = require('fs');
const path    = require('path');
const bodyParser = require('body-parser');
const fetch      = require('node-fetch');
//user defined modules
const db         = require('./models/dbconnection').db;
const utils      = require('./utils/utils');

const PORT     = process.env.PORT || 3000;
const BASE_URL = `localhost:${PORT}/`;
const app     = express();
const api     = express();


hbs.registerPartials(__dirname + '/partials');
hbs.registerHelper('currentYear', function (){
    return new Date().getFullYear();
});

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '/public')));

app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}\n`;
    fs.appendFileSync('log.txt', log);
    console.log(log);
    next();
});

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}...`);
});

// API Endpoints
app.use('/api', api);

api.get('/product_list', (req, res) => {
    let sql = `SELECT productId, name, price, description FROM product_list;`;
    db.query(sql, (err, results) => {
        if(err){
            res.status(404).send(
                {
                    success: "false",
                }
            )
        }else{
            console.log(results);
            res.send(results);
        }
    })
})

api.post('/cart/:userId', (req,res) => {

    var user_id    = req.params.userId;
    var product_id = req.body.product_id;
    var quantity   = req.body.quantity;
    var cartId;
    var price;

   let add_pending_cart_sql =  `INSERT INTO \`cart\` (\`userId\`) SELECT * FROM (SELECT ${user_id}) AS tmp WHERE NOT EXISTS (SELECT \`userId\` FROM \`cart\` WHERE \`userId\` = ${user_id} AND checkedOut = 'pending') LIMIT 1;`;

   db.query(add_pending_cart_sql)
   .then(() =>{

       let get_cart_id_sql = `SELECT \`cartId\` from \`cart\` where \`userId\` = ${user_id} and checkedOut = 'pending';`;
       
       return db.query(get_cart_id_sql);
   }).then((cart_id_row) => {
       cartId = cart_id_row[0].cartId;

       let get_item_price_sql = `SELECT \`price\` from \`product_list\` WHERE \`productId\` = ${product_id};`;    
       
       return db.query(get_item_price_sql);
   }).then((price_row) => {
       price = price_row[0].price;

       let add_item_to_cart_sql = `INSERT INTO \`cart_item\` (\`cartId\`, \`productId\`, \`quantity\`, \`price\`, \`totalPrice\`) VALUES (${cartId}, ${product_id}, ${quantity}, ${price}, ${quantity * price});`;
       
       return db.query(add_item_to_cart_sql)
   }).then(()=>{
        //update the cart value
        let item_value = quantity * price;

        let update_cart_value_sql = `UPDATE \`cart\` SET \`value\` = \`value\` + ${item_value} WHERE \`cartId\` = ${cartId}`;
        
        return db.query(update_cart_value_sql);
   })
   .then(() =>{
        res.send({
            success: "true"
        })
   })
   .catch((err) => {
       console.log(err)
        res.status(500).send({
            success: "false",
        })
   });
})

api.get('/cart/:userId', (req, res) => {

    var user_id    = req.params.userId;
    var cart_rows;

    let get_cart_sql = `SELECT \`productId\`, \`quantity\`, \`price\`, \`totalPrice\` FROM \`cart_item\` WHERE \`cartId\` IN (SELECT \`cartId\` FROM \`cart\` WHERE \`userId\` = ${user_id});`;

    let get_cart_value_sql = `SELECT \`value\` FROM \`cart\` WHERE \`userId\` = ${user_id};`;
    
    db.query(get_cart_sql)
    .then((rows) =>{
        cart_rows = rows;
        return db.query(get_cart_value_sql);
    }).then((value_row) =>{
        let value = value_row[0].value;
        let cart_structure = utils.formatOrder(cart_rows, value);
        res.send(cart_structure);
    }).catch((err) => {
        res.status(500).send({
            success: "false",
        })
    })
})

//checkout the given cart
api.get('/cart/checkout/:userId', (req,res) => {
    //get the complete order from cart
    var user_id    = req.params.userId;
    var cart_rows;

    let get_cart_sql = `SELECT \`productId\`, \`quantity\`, \`price\`, \`totalPrice\` FROM \`cart_item\` WHERE \`cartId\` IN (SELECT \`cartId\` FROM \`cart\` WHERE \`userId\` = ${user_id});`;

    let get_cart_value_sql = `SELECT \`value\` FROM \`cart\` WHERE \`userId\` = ${user_id};`;
    
    db.query(get_cart_sql)
    .then((rows) =>{
        cart_rows = rows;
        return db.query(get_cart_value_sql);
    }).then((value_row) =>{
        let value = value_row[0].value;
        let cart_structure = utils.formatOrder(cart_rows, value);
        
        //RENDER THE PAYMENT PAGE HERE
        res.render('payment_portal.hbs',{
            keyPublishable,
            user_id: user_id,
            order_items: cart_structure.product_rows,
            totalCost: cart_structure.grandTotal,
            totalCostCents: cart_structure.grandTotal * 100,
            data_description: `Order Checkout for ${user_id}`
        })
    }).catch((err) => {
        res.status(500).send({
            success: "false",
        })
    })

})


api.post('/charge/:userId/:amount', (req, res) => {
  //var user_id = req.params.userId;
  var order_amount = req.params.amount;

  stripe.customers.create({
    email: req.body.stripeEmail,
   source: req.body.stripeToken
 })
 .then(customer =>
   stripe.charges.create({
     amount: order_amount * 100,
     description: "Test Charge",
        currency: "usd",
        customer: customer.id
   }))
 .then((charge) => res.send({
     success: "true",
     message: `Payment of ${order_amount} was successful!`
 }))
 .catch(err => {
     if(err){
         console.log(err);
         res.send({success: "false", message: "Payment Failed"});
     }
 });
});