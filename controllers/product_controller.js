const products     = require('../models/products');

var getProductList = async (req, res) => {
    try{
        var list = await products.productList();
        res.send(list);
    }catch(error){
        console.log("Error--getProductList:", error);
        res.send({
            success: "false",
            message: "Error"
        })
    }
}


module.exports = {
    getProductList,
}
