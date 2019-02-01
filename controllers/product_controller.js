const products = require('../models/products');
// const cart     = require('../models/cart');

//Wrapper for handling errors in the async chain
const asyncRoute = route => (req, res, next = console.error) => {
    Promise.resolve(route(req, res)).catch(next)
}

var getProductList = async (req, res) => {
    var list = await products.productList();
    res.send(list);
}

module.exports = {
    getProductList: asyncRoute(getProductList),
}
