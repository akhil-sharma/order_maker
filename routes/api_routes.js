var express = require('express');
var router = express.Router();

const productController = require('../controllers/product_controller');
const cartController    = require('../controllers/cart_controller');


router.get('/productlist', productController.getProductList);

//Add items to a users cart
router.post('/cart/:userId', cartController.addItemToCart);

//View the items in cart
router.get('/cart/:userId', cartController.getUserCart);

//checkout the given cart
//###>> MOVE THESE TO A SEPARATE STRIPE CONTROLLER



module.exports = router;