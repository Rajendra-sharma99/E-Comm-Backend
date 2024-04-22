const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:String,
    price:String,     // Price can hold in doller and other currancy symbol
    categry:String,
    company:String,
    userId:String

    //   name:String,
    //   brand:String,
    //   price:String,
    //   categry:String

});

module.exports = mongoose.model("products", productSchema);