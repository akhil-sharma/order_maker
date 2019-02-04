//stripe
const api_keys       = require('../api_keys') 
const keyPublishable = api_keys.keyPublishable;
const keySecret      = api_keys.keySecret;
const stripe         = require("stripe")(keySecret);

const cart           = require('../models/cart');
const customer       = require('../models/customer');


var handleCheckout = async (req, res) => {
    console.log("Entered handler.");
    try{
        var user_id    = req.params.userId;
        var customerId = customer.retrieveCustomerId(user_id);
        var userCart   = await cart.getUserCart(user_id);

        if((await customerId) === "empty"){
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
            
            var cardLast4 = customer.retrieveCard(customerId);
            res.render('payment_portal_existing.hbs',{
                keyPublishable,
                user_id,
                order_items      : userCart.product_rows,
                totalCost        : userCart.grandTotal,
                totalCostCents   : userCart.grandTotal * 100,
                data_description : `Order Checkout for ${user_id}`,
                card_number      : (await cardLast4) !== "empty" ? (await cardLast4) : ""
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
        var actual_cart         = cart.getUserCart(user_id);

        var stripe_customer     = await stripe.customers.create({
                                            email: req.body.stripeEmail,
                                            source: req.body.stripeToken,
                                            metadata: {
                                                userId: user_id,
                                            }
                                        });
        var existingCustomerId  = customer.retrieveCustomerId(user_id);

        var charge                  = await stripe.charges.create({
                                            amount: order_amount * 1000,
                                            description: `payment for user ${user_id}`,
                                            currency: "usd",
                                            customer: stripe_customer.id
                                        });
        if(charge.paid === true){
            if ((await existingCustomerId) === "empty"){
                var saveCustomerStatus  = await customer.saveCustomerId(stripe_customer);
                var addCardStatus       = await customer.saveCard(charge); //assuming that if a customer exists, then so does a card
            }
            var updateCartStatus    = await cart.updateCartStatus((await actual_cart).cartId);
            res.send({
                success: "true",
                message: "Payment successful",
                receipt: charge.receipt_url
            })
        }      
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
        var actual_cart     = cart.getUserCart(user_id);
        
        var customerId      = customer.retrieveCustomerId(user_id);
        //var stripe_customer = await stripe.customers.retrieve(customerId);

        var charge          = await stripe.charges.create({
                                        amount: order_amount * 100,
                                        description: `payment for user ${user_id}`,
                                            currency: "usd",
                                            customer: (await customerId) //stripe_customer.id
                                    });
        if (charge.paid === true){
            //update cart only if payment was successful 
            var updateCartStatus = await cart.updateCartStatus((await actual_cart).cartId);
            res.send({
                success: "true",
                message: "Payment successful",
                receipt: charge.receipt_url
            })
        }
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


