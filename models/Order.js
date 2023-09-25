const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    products: [],
    price: { type: Number }
}, { timestamps: true } )


module.exports = mongoose.model("Order", orderSchema);