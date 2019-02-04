const cart     = require('../models/cart');
const products  = require('../models/products');

//Wrapper for handling errors in the async chain
const asyncRoute = route => (req, res, next = console.error) => {
    Promise.resolve(route(req, res)).catch(next)
}

var addItemToCart = async (req, res) => {
    try{
        var user_id    = req.params.userId;
        var product_id = req.body.product_id;
        var quantity   = req.body.quantity;
    
        let item_price = await products.getItemPrice(product_id);
        let result     = await cart.addItemToCart(user_id, product_id, item_price, quantity); //result === "success"
        res.send({
            success: "true",
            message: `${product_id} was successfully added to cart.`
        })
    }catch(error){
        console.log("Error:", error);
        res.status(500).send({
            success: "false",
            message: "Error"
        })
    }
}

var getUserCart = async (req, res) => {
    try{
        let user_id = req.params.userId;
        let cart_structure = await cart.getUserCart(user_id);
        res.send(cart_structure); 
    }catch(error){
        console.log("Error:", error)
        res.status(500).send({
            success: false,
        })
    }
    
   
}



module.exports = {
    addItemToCart: asyncRoute(addItemToCart),
    getUserCart  : asyncRoute(getUserCart)
};