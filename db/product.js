const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: String, required: true },
    categry: { type: String, required: true },
    company: { type: String, required: true },
    userId: { type: String, required: true }
});

module.exports = mongoose.model("product", productSchema);
