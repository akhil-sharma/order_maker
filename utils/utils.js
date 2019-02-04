function isEmptyObject(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function isEmptyArray(arr){
    if (Array.isArray(arr) && arr.length === 0){
        return true;
    }else{
        return false;
    }
}

function formatOrder(cart_rows, value, cartId=null){
    var orderObject = {};
    if(! isEmptyArray(cart_rows)){
        orderObject.product_rows = cart_rows;
        orderObject.grandTotal   = value;
        if(cartId != null){
            orderObject.cartId   = cartId;
        }
        return orderObject;
    }else{
        return {
            success: "false",
            message: "Empty cart"
            }
    }
}

//console.log("value:", isEmptyArray([1]));

module.exports = {
    isEmptyObject,
    isEmptyArray,
    formatOrder
}