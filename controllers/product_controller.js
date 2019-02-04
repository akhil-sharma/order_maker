const products = require('../models/products');
// const cart     = require('../models/cart');

//Wrapper for handling errors in the async chain
const asyncRoute = route => (req, res, next = console.error) => {
    Promise.resolve(route(req, res)).catch(next)
}

var getProductList = async (req, res) => {
    try{
        var list = await products.productList();
        res.send(list);
    }catch(error){
        console.log("Error:", error);
        res.send({
            success: "false",
            message: "Error"
        })
    }
}

// var getItemPrice = async (product_id) => {
//     return  products.getItemPrice(product_id);
// }

module.exports = {
    getProductList: asyncRoute(getProductList),
}
