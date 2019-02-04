var express = require('express');
var router = express.Router();

const productController = require('../controllers/product_controller');
const cartController    = require('../controllers/cart_controller');
const paymentController = require('../controllers/payment_controller');

router.get('/productlist', productController.getProductList);

//Add items to a users cart
router.post('/cart/:userId', cartController.addItemToCart);

//View the items in cart
router.get('/cart/:userId', cartController.getUserCart);


//stripe payment
router.get('/cart/checkout/:userId', paymentController.handleCheckout);

router.post('/charge/:userId/:amount', paymentController.handleNewCharge);

router.post('/charge/existing/:userId/:amount', paymentController.handleExistingCharge);

module.exports = router;