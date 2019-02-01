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
//user defined modules
const db = require('./models/dbconnection').db;
const utils = require('./utils/utils');

const PORT     = process.env.PORT || 3000;
const app      = express();
const api      = express();


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

api.use(require('./routes/api_routes'));


//checkout the given cart
//###>> MOVE THESE TO A SEPARATE STRIPE CONTROLLER
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