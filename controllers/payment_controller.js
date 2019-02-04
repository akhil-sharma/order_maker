//stripe
const api_keys       = require('../api_keys') 
const keyPublishable = api_keys.keyPublishable;
const keySecret      = api_keys.keySecret;
const stripe         = require("stripe")(keySecret);

const cart           = require('../models/cart');
const customer       = require('../models/customer');


var handleCheckout = async (req, res) => {
    try{
        var user_id    = req.params.userId;
        var userCart   = await cart.getUserCart(user_id);
        var customerId = await customer.retrieveCustomerId(user_id);
        //console.log("customerId:", customerId);
        if(customerId === "empty"){
            //render normal page
            res.render('payment_portal.hbs',{
                keyPublishable,
                user_id,
                order_items      : userCart.product_rows,
                totalCost        : userCart.grandTotal,
                totalCostCents   : userCart.grandTotal * 100,
                data_description : `Order Checkout for ${user_id}`
            });
        }else{
            //render with an additional
            var cardLast4 = await customer.retrieveCard(customerId);
            res.render('payment_portal_existing.hbs',{
                keyPublishable,
                user_id,
                order_items      : userCart.product_rows,
                totalCost        : userCart.grandTotal,
                totalCostCents   : userCart.grandTotal * 100,
                data_description : `Order Checkout for ${user_id}`,
                card_number      : cardLast4 !== "empty" ? cardLast4 : "",
            });
        }
    }catch(error){
        console.log("Error--handleCheckout:", error)
        res.status(500).send({
            success: "false",
            message: "invalid request"
        })
    }
}

var handleNewCharge = async (req, res) => {
    try{
        var order_amount        = req.params.amount;
        var user_id             = req.params.userId;
        var actual_cart         = await cart.getUserCart(user_id);

        var stripe_customer     = await stripe.customers.create({
                                            email: req.body.stripeEmail,
                                            source: req.body.stripeToken,
                                            metadata: {
                                                userId: user_id,
                                            }
                                        });
        var existingCustomerId  = await customer.retrieveCustomerId(user_id);
        if (existingCustomerId === "empty"){
            //save if no id exists
            var saveCustomerStatus = await customer.saveCustomerId(stripe_customer);
            //console.log("saveCustomerStatus", saveCustomerStatus);
        }
        var charge              = await stripe.charges.create({
                                            amount: order_amount * 100,
                                            description: `payment for user ${user_id}`,
                                            currency: "usd",
                                            customer: stripe_customer.id
                                        });
        var updateCartStatus    = await cart.updateCartStatus(actual_cart.cartId);
        var addCardStatus       = await customer.saveCard(charge);
        res.send({
            success: "true",
            message: "Payment successful"
        })       
    }catch(error){
        if(error){
            console.log("ERROR--handleNewCharge:",error);
            res.send({
                success: "false",
                message: "payment failed"
            })
        }
    }
}

var handleExistingCharge = async (req, res) => {
    try{
        var order_amount    = req.params.amount;
        var user_id         = req.params.userId;
        var actual_cart     = await cart.getUserCart(user_id);
        var customerId      = await customer.retrieveCustomerId(user_id);
        var stripe_customer = await stripe.customers.retrieve(customerId);

        var charge          = await stripe.charges.create({
                                        amount: order_amount * 100,
                                        description: `payment for user ${user_id}`,
                                            currency: "usd",
                                            customer: stripe_customer.id
                                    });

        var updateCartStatus = await cart.updateCartStatus(actual_cart.cartId);
        res.send({
            success: "true",
            message: "Payment successful"
        })
    }catch(error){
        if(error){
            console.log("Error-handleExistingCharge:", error);
            res.send({
                success: "false",
                message: "payment failed"
            })
        }
    }
}


module.exports = {
    handleCheckout,
    handleNewCharge,
    handleExistingCharge
}


