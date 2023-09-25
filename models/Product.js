const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    name: { type: String },
    stock: { type: Number },
    dimensions: { type: String },

},
    {timestamps: true}
)


module.exports = mongoose.model("Product", productSchema);